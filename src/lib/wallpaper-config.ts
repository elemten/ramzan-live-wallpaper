export type WallpaperMode = "life" | "ramadan";
export type RamadanTheme = "classic" | "girly";

export interface LifeWallpaperConfig {
  mode: "life";
  dateOfBirth: string;
  timeZone: string;
  title: string;
}

export interface RamadanWallpaperConfig {
  mode: "ramadan";
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  calculationMethod: number;
  title: string;
  theme: RamadanTheme;
}

export type WallpaperConfig = LifeWallpaperConfig | RamadanWallpaperConfig;

export const DEFAULT_LIFE_CONFIG: LifeWallpaperConfig = {
  mode: "life",
  dateOfBirth: "1996-01-01",
  timeZone: "America/New_York",
  title: "LIFE CALENDAR",
};

export const DEFAULT_RAMADAN_TITLE = "RAMADAN CALENDAR";
export const DEFAULT_RAMADAN_METHOD = 2;
export const DEFAULT_RAMADAN_THEME: RamadanTheme = "classic";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function cleanText(value: unknown, fallback: string, maxLen: number): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, maxLen);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeRamadanTheme(value: unknown): RamadanTheme {
  return value === "girly" ? "girly" : DEFAULT_RAMADAN_THEME;
}

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeLifeConfig(input: Partial<LifeWallpaperConfig>): LifeWallpaperConfig {
  return {
    mode: "life",
    dateOfBirth:
      typeof input.dateOfBirth === "string" && isIsoDate(input.dateOfBirth)
        ? input.dateOfBirth
        : DEFAULT_LIFE_CONFIG.dateOfBirth,
    timeZone:
      typeof input.timeZone === "string" && isValidTimeZone(input.timeZone)
        ? input.timeZone
        : DEFAULT_LIFE_CONFIG.timeZone,
    title: cleanText(input.title, DEFAULT_LIFE_CONFIG.title, 28),
  };
}

export function normalizeRamadanConfig(
  input: Partial<RamadanWallpaperConfig>,
): RamadanWallpaperConfig | null {
  const city = cleanText(input.city, "Current Location", 40);
  const country = cleanText(input.country, "", 40);
  const timeZone =
    typeof input.timeZone === "string" && isValidTimeZone(input.timeZone) ? input.timeZone : "";
  const latitude = typeof input.latitude === "number" ? input.latitude : Number(input.latitude);
  const longitude = typeof input.longitude === "number" ? input.longitude : Number(input.longitude);
  const methodRaw =
    typeof input.calculationMethod === "number"
      ? input.calculationMethod
      : Number(input.calculationMethod);
  const calculationMethod = Number.isFinite(methodRaw)
    ? clamp(Math.round(methodRaw), 0, 23)
    : DEFAULT_RAMADAN_METHOD;
  const theme = normalizeRamadanTheme(input.theme);

  if (!timeZone || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    mode: "ramadan",
    city,
    country,
    latitude: clamp(latitude, -90, 90),
    longitude: clamp(longitude, -180, 180),
    timeZone,
    calculationMethod,
    title: cleanText(input.title, DEFAULT_RAMADAN_TITLE, 28),
    theme,
  };
}
