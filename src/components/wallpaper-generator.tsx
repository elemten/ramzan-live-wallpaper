"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { DEFAULT_LIFE_CONFIG, DEFAULT_RAMADAN_TITLE, type WallpaperMode } from "@/lib/wallpaper-config";

interface TokenResponse {
  mode: WallpaperMode;
  token: string;
  wallpaperUrl: string;
  wallpaperPath: string;
  setupUrl: string;
}

interface LifeFormState {
  dateOfBirth: string;
  timeZone: string;
  title: string;
}

interface RamadanFormState {
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  calculationMethod: number;
  title: string;
}

const FALLBACK_TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Karachi",
  "Asia/Dubai",
  "UTC",
];

const CALC_METHODS = [
  { value: 1, label: "1 - University of Islamic Sciences, Karachi" },
  { value: 2, label: "2 - Islamic Society of North America (ISNA)" },
  { value: 3, label: "3 - Muslim World League" },
  { value: 4, label: "4 - Umm Al-Qura University, Makkah" },
  { value: 5, label: "5 - Egyptian General Authority" },
  { value: 8, label: "8 - Gulf Region" },
  { value: 9, label: "9 - Kuwait" },
  { value: 10, label: "10 - Qatar" },
  { value: 11, label: "11 - Majlis Ugama Islam Singapore" },
  { value: 12, label: "12 - Union Organization islamic de France" },
  { value: 13, label: "13 - Diyanet, Turkey" },
  { value: 14, label: "14 - Spiritual Administration of Muslims of Russia" },
];

const CARD_BASE =
  "rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 transition hover:border-neutral-700";
const CARD_SELECTED =
  "rounded-2xl border border-sky-400/60 bg-gradient-to-br from-sky-600/10 to-neutral-950 p-5 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]";

export default function WallpaperGenerator() {
  const detectedTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [mode, setMode] = useState<WallpaperMode | null>(null);

  const [lifeForm, setLifeForm] = useState<LifeFormState>({
    dateOfBirth: DEFAULT_LIFE_CONFIG.dateOfBirth,
    timeZone: detectedTimeZone || DEFAULT_LIFE_CONFIG.timeZone,
    title: DEFAULT_LIFE_CONFIG.title,
  });
  const [ramadanForm, setRamadanForm] = useState<RamadanFormState>({
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    timeZone: detectedTimeZone || DEFAULT_LIFE_CONFIG.timeZone,
    calculationMethod: 2,
    title: DEFAULT_RAMADAN_TITLE,
  });

  const [result, setResult] = useState<TokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeZones = useMemo(() => {
    const intlWithExtras = Intl as unknown as {
      supportedValuesOf?: (key: "timeZone") => string[];
    };
    if (typeof intlWithExtras.supportedValuesOf === "function") {
      return intlWithExtras.supportedValuesOf("timeZone");
    }
    return FALLBACK_TIME_ZONES;
  }, []);

  const previewUrl = result ? `${result.wallpaperPath}&at=${encodeURIComponent(new Date().toISOString())}` : null;

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device/browser.");
      return;
    }

    setError(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_LIFE_CONFIG.timeZone;
        setRamadanForm((prev) => ({
          ...prev,
          city: prev.city || "Current Location",
          latitude: lat,
          longitude: lon,
          timeZone: tz,
        }));
        setIsLocating(false);
      },
      () => {
        setError("Could not access your location. Allow location permission or enter city manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function handleGenerate() {
    if (!mode) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const payload =
        mode === "life"
          ? {
              mode: "life",
              dateOfBirth: lifeForm.dateOfBirth,
              timeZone: lifeForm.timeZone,
              title: lifeForm.title,
            }
          : {
              mode: "ramadan",
              city: ramadanForm.city,
              country: ramadanForm.country,
              latitude: ramadanForm.latitude ? Number(ramadanForm.latitude) : undefined,
              longitude: ramadanForm.longitude ? Number(ramadanForm.longitude) : undefined,
              timeZone: ramadanForm.timeZone || undefined,
              calculationMethod: ramadanForm.calculationMethod,
              title: ramadanForm.title,
            };

      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as TokenResponse | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Could not generate token.");
      }

      setResult(data as TokenResponse);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not generate token.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-neutral-800 bg-neutral-950/80 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">iOS Wallpaper Generator</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Choose Calendar Type</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
          Pick a mode first. After generating one token link, your shortcut can refresh this wallpaper daily.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button className={mode === "life" ? CARD_SELECTED : CARD_BASE} onClick={() => setMode("life")}>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Option 1</p>
            <h2 className="mt-2 text-3xl">Life Calendar</h2>
            <p className="mt-2 text-sm text-neutral-400">Shows week-grid life progress. Fixed to 100 years.</p>
          </button>
          <button className={mode === "ramadan" ? CARD_SELECTED : CARD_BASE} onClick={() => setMode("ramadan")}>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Option 2</p>
            <h2 className="mt-2 text-3xl">Ramadan Calendar</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Uses AlAdhan timings with exact coordinates or city lookup.
            </p>
          </button>
        </div>

        {mode === "life" ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-neutral-400">Date of birth</span>
              <input
                type="date"
                value={lifeForm.dateOfBirth}
                onChange={(event) => setLifeForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-400">Time zone</span>
              <select
                value={lifeForm.timeZone}
                onChange={(event) => setLifeForm((prev) => ({ ...prev, timeZone: event.target.value }))}
                className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
              >
                {timeZones.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm text-neutral-400">Title</span>
              <input
                type="text"
                maxLength={28}
                value={lifeForm.title}
                onChange={(event) => setLifeForm((prev) => ({ ...prev, title: event.target.value }))}
                className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
              />
            </label>
          </div>
        ) : null}

        {mode === "ramadan" ? (
          <div className="mt-8 grid gap-5">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={isLocating}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 hover:border-neutral-500 disabled:opacity-50"
              >
                {isLocating ? "Locating..." : "Use My Current Location"}
              </button>
            </div>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-400">City (fallback if no coordinates)</span>
              <input
                type="text"
                placeholder="Karachi Pakistan"
                value={ramadanForm.city}
                onChange={(event) => setRamadanForm((prev) => ({ ...prev, city: event.target.value }))}
                className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-400">Country (optional)</span>
              <input
                type="text"
                placeholder="Pakistan"
                value={ramadanForm.country}
                onChange={(event) => setRamadanForm((prev) => ({ ...prev, country: event.target.value }))}
                className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-neutral-400">Latitude (exact)</span>
                <input
                  type="number"
                  step="any"
                  placeholder="52.1332"
                  value={ramadanForm.latitude}
                  onChange={(event) => setRamadanForm((prev) => ({ ...prev, latitude: event.target.value }))}
                  className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-neutral-400">Longitude (exact)</span>
                <input
                  type="number"
                  step="any"
                  placeholder="-106.6700"
                  value={ramadanForm.longitude}
                  onChange={(event) => setRamadanForm((prev) => ({ ...prev, longitude: event.target.value }))}
                  className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
                />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-neutral-400">Time zone (for exact coordinates)</span>
                <select
                  value={ramadanForm.timeZone}
                  onChange={(event) => setRamadanForm((prev) => ({ ...prev, timeZone: event.target.value }))}
                  className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
                >
                  {timeZones.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>
                      {timeZone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-neutral-400">AlAdhan calculation method</span>
                <select
                  value={ramadanForm.calculationMethod}
                  onChange={(event) =>
                    setRamadanForm((prev) => ({ ...prev, calculationMethod: Number(event.target.value) }))
                  }
                  className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
                >
                  {CALC_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-sm text-neutral-400">Title</span>
              <input
                type="text"
                maxLength={28}
                value={ramadanForm.title}
                onChange={(event) => setRamadanForm((prev) => ({ ...prev, title: event.target.value }))}
                className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
              />
            </label>
            <p className="text-xs text-neutral-500">
              If latitude/longitude are filled, the app will use exact coordinates. If empty, it will use city search.
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !mode}
            className="h-12 w-full rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate Token + URL"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        {result ? (
          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-neutral-800 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Token</p>
              <p className="mt-2 break-all font-mono text-xs text-neutral-200">{result.token}</p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Wallpaper URL</p>
              <p className="mt-2 break-all font-mono text-xs text-neutral-200">{result.wallpaperUrl}</p>
              <a
                href={result.setupUrl}
                className="mt-3 inline-flex rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-500"
              >
                Open setup page
              </a>
            </div>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-6">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Preview</p>
          <div className="mt-4 overflow-hidden rounded-[2rem] border border-neutral-800 bg-black p-2">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Generated wallpaper preview"
                width={1290}
                height={2796}
                unoptimized
                className="h-auto w-full rounded-[1.6rem]"
              />
            ) : (
              <div className="grid aspect-[9/19.5] place-items-center rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_#212327_0%,_#050506_60%)] px-8 text-center text-sm text-neutral-500">
                Select a calendar mode to start.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Shortcut Flow</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-300">
            <li>Action: `URL` and paste generated wallpaper URL.</li>
            <li>Action: `Get Contents of URL`.</li>
            <li>Action: `Set Wallpaper` and choose Lock Screen.</li>
            <li>Disable `Show Preview` and `Crop to Subject`.</li>
            <li>For life mode run daily at 12:00 PM. For ramadan run before Fajr (fixed early time).</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
