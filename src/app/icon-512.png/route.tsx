import { ImageResponse } from "next/og";

// Manifest-sized counterpart to icon.tsx/apple-icon.tsx -- same placeholder
// mark, served as a literal /icon-512.png route so manifest.ts can link it.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F0F12",
          color: "#00b4d8",
          fontSize: 290,
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { width: 512, height: 512 }
  );
}
