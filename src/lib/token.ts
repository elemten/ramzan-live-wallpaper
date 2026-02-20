import {
  normalizeLifeConfig,
  normalizeRamadanConfig,
  type LifeWallpaperConfig,
  type RamadanWallpaperConfig,
  type WallpaperConfig,
} from "@/lib/wallpaper-config";

interface LifeTokenPayloadV2 {
  v: 2;
  m: "life";
  d: string;
  z: string;
  t: string;
}

interface RamadanTokenPayloadV2 {
  v: 2;
  m: "ramadan";
  c: string;
  n: string;
  la: number;
  lo: number;
  z: string;
  cm?: number;
  t: string;
}

interface LegacyLifeTokenV1 {
  v: 1;
  d: string;
  z: string;
  t: string;
}

type TokenPayloadV2 = LifeTokenPayloadV2 | RamadanTokenPayloadV2;

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function encodeWallpaperToken(config: WallpaperConfig): string {
  let payload: TokenPayloadV2;

  if (config.mode === "life") {
    const safeConfig = normalizeLifeConfig(config);
    payload = {
      v: 2,
      m: "life",
      d: safeConfig.dateOfBirth,
      z: safeConfig.timeZone,
      t: safeConfig.title,
    };
  } else {
    const safeConfig = normalizeRamadanConfig(config);
    if (!safeConfig) {
      throw new Error("Invalid ramadan config.");
    }
    payload = {
      v: 2,
      m: "ramadan",
      c: safeConfig.city,
      n: safeConfig.country,
      la: safeConfig.latitude,
      lo: safeConfig.longitude,
      z: safeConfig.timeZone,
      cm: safeConfig.calculationMethod,
      t: safeConfig.title,
    };
  }

  return toBase64Url(JSON.stringify(payload));
}

function decodeLifeV2(parsed: LifeTokenPayloadV2): LifeWallpaperConfig {
  return normalizeLifeConfig({
    mode: "life",
    dateOfBirth: parsed.d,
    timeZone: parsed.z,
    title: parsed.t,
  });
}

function decodeRamadanV2(parsed: RamadanTokenPayloadV2): RamadanWallpaperConfig | null {
  return normalizeRamadanConfig({
    mode: "ramadan",
    city: parsed.c,
    country: parsed.n,
    latitude: parsed.la,
    longitude: parsed.lo,
    timeZone: parsed.z,
    calculationMethod: parsed.cm,
    title: parsed.t,
  });
}

function decodeLegacyV1(parsed: LegacyLifeTokenV1): LifeWallpaperConfig {
  return normalizeLifeConfig({
    mode: "life",
    dateOfBirth: parsed.d,
    timeZone: parsed.z,
    title: parsed.t,
  });
}

export function decodeWallpaperToken(token: string): WallpaperConfig | null {
  try {
    const raw = fromBase64Url(token);
    const parsed = JSON.parse(raw) as TokenPayloadV2 | LegacyLifeTokenV1;

    if (parsed.v === 2) {
      if (parsed.m === "life") {
        return decodeLifeV2(parsed);
      }

      if (parsed.m === "ramadan") {
        return decodeRamadanV2(parsed);
      }
      return null;
    }

    if (parsed.v === 1) {
      return decodeLegacyV1(parsed);
    }

    return null;
  } catch {
    return null;
  }
}
