import sharp from "sharp";

import { ensureSharpFontConfig } from "@/lib/sharp-fonts";
import { getRamadanTimings } from "@/lib/ramadan-data";
import { decodeWallpaperToken } from "@/lib/token";
import { createLifeWallpaperSvg, createRamadanWallpaperSvg } from "@/lib/wallpaper-svg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readDimension(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.round(Math.min(Math.max(parsed, min), max));
}

function readTimestamp(value: string | null): Date {
  if (!value) {
    return new Date();
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    return new Date(asNumber);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  const decodedToken = token.replace(/\.png$/i, "");
  const config = decodeWallpaperToken(decodedToken);

  if (!config) {
    return new Response("Invalid token", { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const width = readDimension(searchParams.get("w"), 1290, 720, 2200);
  const height = readDimension(searchParams.get("h"), 2796, 1280, 4200);
  const now = readTimestamp(searchParams.get("at"));

  let svg: string;
  let filenamePrefix = "wallpaper";

  if (config.mode === "life") {
    svg = createLifeWallpaperSvg(config, { width, height, now });
    filenamePrefix = "life-calendar";
  } else {
    const timings = await getRamadanTimings(
      config.latitude,
      config.longitude,
      config.timeZone,
      config.calculationMethod,
      now,
    );
    if (!timings) {
      return new Response("Could not fetch ramadan timings for this city.", { status: 502 });
    }
    svg = createRamadanWallpaperSvg(config, timings, { width, height, now });
    filenamePrefix = "ramadan-calendar";
  }

  await ensureSharpFontConfig();
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const body = new Uint8Array(png);

  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `inline; filename="${filenamePrefix}-${decodedToken.slice(0, 10)}.png"`,
    },
  });
}
