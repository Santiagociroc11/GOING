import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth";
import { getMinioClient, isMinioConfigured } from "@/lib/minio";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const session = await getEffectiveSession();
        if (!session?.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!isMinioConfigured()) {
            return NextResponse.json({ message: "Storage not configured" }, { status: 503 });
        }

        const { path } = await params;
        if (!path?.length) {
            return NextResponse.json({ message: "Invalid path" }, { status: 400 });
        }

        const bucket = path[0];
        const objectName = path.slice(1).join("/");
        if (!bucket || !objectName) {
            return NextResponse.json({ message: "Invalid path" }, { status: 400 });
        }

        const mc = getMinioClient();
        if (!mc) return NextResponse.json({ message: "Storage error" }, { status: 503 });

        const stream = await mc.getObject(bucket, objectName);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const ext = objectName.split(".").pop()?.toLowerCase();
        const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error) {
        console.error("File serve error:", error);
        return NextResponse.json({ message: "File not found" }, { status: 404 });
    }
}
