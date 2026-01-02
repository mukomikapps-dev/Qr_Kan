import type { NextRequest } from "next/server";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const url = new URL(req.url);
  const target = `https://qrkan.com/@${encodeURIComponent(username)}`;
  const format = url.searchParams.get("format") ?? "svg";
  
  // Get custom color from query params, default to black
  const color = url.searchParams.get("color") || "#000000";
  // Validate hex color
  const qrColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) ? color : "#000000";
  
  if (format === "png") {
    const buf = await QRCode.toBuffer(target, {
      type: "png",
      margin: 1,
      color: { dark: qrColor, light: "#ffffff00" },
      errorCorrectionLevel: "M",
      width: 1024,
    });
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
  const svg = await QRCode.toString(target, {
    type: "svg",
    margin: 1,
    color: { dark: qrColor, light: "#ffffff00" },
    errorCorrectionLevel: "M",
    width: 512,
  });
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
    },
  });
}


