import { ImageResponse } from "next/og";

// iOS applies its own corner/shadow mask on top of this, so no rounding or
// transparency here -- same placeholder-mark caveat as icon.tsx.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 100,
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { ...size }
  );
}
