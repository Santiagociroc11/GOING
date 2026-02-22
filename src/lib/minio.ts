import * as Minio from "minio";

// Soporta MINIO_* y STORAGE_* (compatible con n8n, etc.)
function parseEndpoint(): { host: string; port: number; useSSL: boolean } | null {
    const raw =
        process.env.MINIO_ENDPOINT ||
        process.env.STORAGE_ENDPOINT?.replace(/\/$/, "");
    if (!raw) return null;
    try {
        const url = raw.startsWith("http") ? new URL(raw) : new URL(`http://${raw}`);
        return {
            host: url.hostname,
            port: url.port ? parseInt(url.port, 10) : 9000,
            useSSL: url.protocol === "https:",
        };
    } catch {
        return { host: raw, port: parseInt(process.env.MINIO_PORT || "9000", 10), useSSL: false };
    }
}

const parsed = parseEndpoint();
const accessKey = process.env.MINIO_ACCESS_KEY || process.env.STORAGE_ACCESS_KEY_ID;
const secretKey = process.env.MINIO_SECRET_KEY || process.env.STORAGE_SECRET_ACCESS_KEY;
const bucket = process.env.MINIO_BUCKET || process.env.STORAGE_BUCKET_NAME || "going";

let client: Minio.Client | null = null;

export function getMinioClient(): Minio.Client | null {
    if (!parsed || !accessKey || !secretKey) return null;
    if (!client) {
        client = new Minio.Client({
            endPoint: parsed.host,
            port: parsed.port,
            useSSL: parsed.useSSL,
            accessKey,
            secretKey,
        });
    }
    return client;
}

export function isMinioConfigured(): boolean {
    return !!(parsed && accessKey && secretKey);
}

export async function ensureBucket(): Promise<boolean> {
    const mc = getMinioClient();
    if (!mc) return false;
    try {
        const exists = await mc.bucketExists(bucket);
        if (!exists) await mc.makeBucket(bucket, "us-east-1");
        return true;
    } catch {
        return false;
    }
}

export async function uploadFile(
    buffer: Buffer,
    objectName: string,
    contentType: string
): Promise<string | null> {
    const mc = getMinioClient();
    if (!mc) return null;
    try {
        await ensureBucket();
        await mc.putObject(bucket, objectName, buffer, buffer.length, { "Content-Type": contentType });
        const publicUrl = process.env.MINIO_PUBLIC_URL || process.env.STORAGE_PUBLIC_URL;
        if (publicUrl) {
            return `${publicUrl.replace(/\/$/, "")}/${bucket}/${objectName}`;
        }
        return `/api/files/${bucket}/${objectName}`;
    } catch (err) {
        console.error("[MinIO] Upload error:", err);
        return null;
    }
}
