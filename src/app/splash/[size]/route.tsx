import { ImageResponse } from "next/og";

export const runtime = "edge";

type Props = { params: Promise<{ size: string }> };

export async function GET(_req: Request, { params }: Props) {
    const { size } = await params;
    const [w, h] = size.split("x").map(Number);
    const width = w || 1284;
    const height = h || 2778;

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
                }}
            >
                <div
                    style={{
                        fontSize: width * 0.12,
                        fontWeight: 800,
                        color: "white",
                    }}
                >
                    Going
                </div>
            </div>
        ),
        { width, height }
    );
}
