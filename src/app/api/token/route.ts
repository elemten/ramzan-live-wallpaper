import { NextResponse } from "next/server";

import { geocodeCity } from "@/lib/ramadan-data";
import {
  normalizeLifeConfig,
  normalizeRamadanConfig,
  type LifeWallpaperConfig,
  type WallpaperMode,
} from "@/lib/wallpaper-config";
import { encodeWallpaperToken } from "@/lib/token";

interface TokenRequestBody {
  mode?: WallpaperMode;
  dateOfBirth?: string;
  timeZone?: string;
  title?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  calculationMethod?: number;
}

function getOrigin(headers: Headers): string {
  const proto = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

function lifeResponse(config: LifeWallpaperConfig, token: string, origin: string) {
  const wallpaperPath = `/api/wallpaper/${token}?w=1290&h=2796`;
  return NextResponse.json({
    mode: "life",
    token,
    config,
    wallpaperUrl: `${origin}${wallpaperPath}`,
    wallpaperPath,
    setupUrl: `${origin}/setup/${token}`,
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as TokenRequestBody;
    const mode = body.mode ?? "ramadan";
    const origin = getOrigin(request.headers);

    if (mode === "life") {
      const config = normalizeLifeConfig({
        mode: "life",
        dateOfBirth: body.dateOfBirth,
        timeZone: body.timeZone,
        title: body.title,
      });
      const token = encodeWallpaperToken(config);
      return lifeResponse(config, token, origin);
    }

    if (mode === "ramadan") {
      const lat = typeof body.latitude === "number" ? body.latitude : Number(body.latitude);
      const lon = typeof body.longitude === "number" ? body.longitude : Number(body.longitude);
      const hasExactCoordinates = Number.isFinite(lat) && Number.isFinite(lon);

      let config = hasExactCoordinates
        ? normalizeRamadanConfig({
            mode: "ramadan",
            city: body.city?.trim() || "Current Location",
            country: body.country?.trim() || "",
            latitude: lat,
            longitude: lon,
            timeZone: body.timeZone,
            calculationMethod: body.calculationMethod,
            title: body.title,
          })
        : null;

      if (!config) {
        const cityQuery = (body.city ?? "").trim();
        if (!cityQuery) {
          return NextResponse.json(
            { error: "Provide exact latitude/longitude, or enter a city name." },
            { status: 400 },
          );
        }

        const city = await geocodeCity(cityQuery);
        if (!city) {
          return NextResponse.json(
            { error: "City not found. Try with city and country, for example: Karachi Pakistan." },
            { status: 404 },
          );
        }

        config = normalizeRamadanConfig({
          mode: "ramadan",
          city: city.city,
          country: city.country,
          latitude: city.latitude,
          longitude: city.longitude,
          timeZone: city.timeZone,
          calculationMethod: body.calculationMethod,
          title: body.title,
        });
      }

      if (!config) {
        return NextResponse.json({ error: "Could not build ramadan config." }, { status: 400 });
      }

      const token = encodeWallpaperToken(config);
      const wallpaperPath = `/api/wallpaper/${token}?w=1290&h=2796`;
      return NextResponse.json({
        mode: "ramadan",
        token,
        config,
        wallpaperUrl: `${origin}${wallpaperPath}`,
        wallpaperPath,
        setupUrl: `${origin}/setup/${token}`,
      });
    }

    return NextResponse.json({ error: "Unsupported mode." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}
