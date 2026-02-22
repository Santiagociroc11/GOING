import { ImageResponse } from "next/og";

export const runtime = "edge";

type Props = { params: Promise<{ size: string }> };

export async function GET(_req: Request, { params }: Props) {
    const { size } = await params;
    const num = parseInt(size, 10);
    const s = Number.isNaN(num) || num < 48 ? 192 : Math.min(num, 512);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ea580c",
                    borderRadius: s >= 512 ? 64 : 24,
                    fontSize: s * 0.4,
                    fontWeight: 800,
                    color: "white",
                }}
            >
                G
            </div>
        ),
        { width: s, height: s }
    );
}
