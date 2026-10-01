import { ImageResponse } from "next/og";

// Placeholder mark using the app's own palette (see globals.css --accent)
// until real branding exists -- swap this file for a designed icon later.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 7,
        }}
      >
        F
      </div>
    ),
    { ...size }
  );
}
