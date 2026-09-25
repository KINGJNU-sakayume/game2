import { ImageResponse } from "next/og";

export const alt = "비가 그친 뒤";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

/** Build-time Apple touch icon. The source stays text-only in Git. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#080d12",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div style={{ background: "#111b23", bottom: 0, display: "flex", height: 58, left: 0, position: "absolute", width: "100%" }} />
      {[30, 61, 93, 125, 151].map((left, index) => (
        <div
          key={left}
          style={{
            background: "#718997",
            borderRadius: 4,
            display: "flex",
            height: index % 2 ? 25 : 19,
            left,
            opacity: 0.72,
            position: "absolute",
            top: 31 + (index % 3) * 22,
            transform: "rotate(25deg)",
            width: 4,
          }}
        />
      ))}
      <div style={{ background: "#d6c69d", borderRadius: 4, bottom: 48, display: "flex", height: 5, left: 25, position: "absolute", transform: "rotate(-5deg)", width: 132 }} />
      <div style={{ background: "#eef0e8", borderRadius: 2, bottom: 40, display: "flex", height: 2, left: 40, opacity: 0.65, position: "absolute", transform: "rotate(-5deg)", width: 104 }} />
    </div>,
    size,
  );
}
