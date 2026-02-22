import * as Minio from "minio";

const endpoint = process.env.MINIO_ENDPOINT;
const port = parseInt(process.env.MINIO_PORT || "9000", 10);
const useSSL = process.env.MINIO_USE_SSL === "true";
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET || "going";

let client: Minio.Client | null = null;

export function getMinioClient(): Minio.Client | null {
    if (!endpoint || !accessKey || !secretKey) return null;
    if (!client) {
        client = new Minio.Client({
            endPoint: endpoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }
    return client;
}

export function isMinioConfigured(): boolean {
    return !!(endpoint && accessKey && secretKey);
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
        const publicUrl = process.env.MINIO_PUBLIC_URL;
        if (publicUrl) {
            return `${publicUrl.replace(/\/$/, "")}/${bucket}/${objectName}`;
        }
        return `/api/files/${bucket}/${objectName}`;
    } catch (err) {
        console.error("[MinIO] Upload error:", err);
        return null;
    }
}
