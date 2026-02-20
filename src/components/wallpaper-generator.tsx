"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { DEFAULT_LIFE_CONFIG } from "@/lib/wallpaper-config";

interface TokenResponse {
  mode: "ramadan" | "life";
  wallpaperUrl: string;
  wallpaperPath: string;
  setupUrl: string;
}

interface RamadanFormState {
  latitude: string;
  longitude: string;
  calculationMethod: number;
}

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

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export default function WallpaperGenerator() {
  const detectedTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_LIFE_CONFIG.timeZone,
    [],
  );

  const [ramadanForm, setRamadanForm] = useState<RamadanFormState>({
    latitude: "",
    longitude: "",
    calculationMethod: 2,
  });

  const [result, setResult] = useState<TokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = result ? `${result.wallpaperPath}&at=${encodeURIComponent(new Date().toISOString())}` : null;

  function resetTransientMessages() {
    setError(null);
    setCopyStatus(null);
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported on this device/browser. Enter exact latitude and longitude manually.");
      return;
    }

    resetTransientMessages();
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRamadanForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => {
        setError(
          "Could not access location. If you prefer not to allow permission, ask Siri \"What are my coordinates?\" and paste them below.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function handleGenerate() {
    const lat = Number(ramadanForm.latitude);
    const lon = Number(ramadanForm.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setError("Enter exact latitude and longitude, or use your current location.");
      return;
    }

    resetTransientMessages();
    setIsLoading(true);

    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ramadan",
          city: "Current Location",
          latitude: lat,
          longitude: lon,
          timeZone: detectedTimeZone,
          calculationMethod: ramadanForm.calculationMethod,
        }),
      });

      const data = (await response.json()) as TokenResponse | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Could not generate URL.");
      }

      setResult(data as TokenResponse);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not generate URL.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyUrl() {
    if (!result?.wallpaperUrl) {
      return;
    }

    setIsCopying(true);
    setCopyStatus(null);
    try {
      await copyText(result.wallpaperUrl);
      setCopyStatus("URL copied.");
    } catch {
      setCopyStatus("Could not copy automatically. Copy it manually.");
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-neutral-800 bg-neutral-950/85 p-5 shadow-[0_30px_70px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">iOS Wallpaper Generator</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Ramadan Wallpaper Generator</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
          Ramadan calendar mode is enabled by default. Use your live location or paste exact coordinates.
        </p>

        <div className="mt-8 rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-600/10 to-neutral-950 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Calendar Mode</p>
          <h2 className="mt-2 text-2xl sm:text-3xl">Ramadan Calendar</h2>
          <p className="mt-2 text-sm text-neutral-400">Daily prayer-times wallpaper using your exact location coordinates.</p>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="rounded-2xl border border-neutral-800 bg-black/25 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={isLocating}
                className="inline-flex h-11 items-center rounded-xl border border-neutral-700 px-4 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLocating ? "Locating..." : "Use My Current Location"}
              </button>
              <p className="text-xs text-neutral-500">
                No location permission? Ask Siri &quot;What are my coordinates?&quot; and paste them below.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-neutral-400">Latitude (exact)</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="52.133200"
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
                inputMode="decimal"
                placeholder="-106.670000"
                value={ramadanForm.longitude}
                onChange={(event) => setRamadanForm((prev) => ({ ...prev, longitude: event.target.value }))}
                className="h-12 rounded-xl border border-neutral-700 bg-neutral-900 px-3 text-sm outline-none focus:border-neutral-500"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm text-neutral-400">Calculation method (optional)</span>
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

        <div className="mt-8">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate URL"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        {result ? (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-black/30 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Wallpaper URL</p>
            <p className="mt-2 break-all font-mono text-xs text-neutral-200 sm:text-sm">{result.wallpaperUrl}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                disabled={isCopying}
                className="inline-flex h-10 items-center rounded-lg border border-neutral-700 px-3 text-xs font-medium text-neutral-200 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCopying ? "Copying..." : "Copy URL"}
              </button>
              <a
                href={result.setupUrl}
                className="inline-flex h-10 items-center rounded-lg border border-neutral-700 px-3 text-xs font-medium text-neutral-200 transition hover:border-neutral-500"
              >
                Open setup page
              </a>
            </div>
            {copyStatus ? <p className="mt-3 text-xs text-emerald-300">{copyStatus}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-6">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/85 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Preview</p>
          <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-neutral-800 bg-black p-2 sm:rounded-[2rem]">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Generated wallpaper preview"
                width={1290}
                height={2796}
                unoptimized
                className="h-auto w-full rounded-[1.2rem] sm:rounded-[1.6rem]"
              />
            ) : (
              <div className="grid aspect-[9/19.5] place-items-center rounded-[1.2rem] bg-[radial-gradient(circle_at_top,_#212327_0%,_#050506_60%)] px-6 text-center text-sm text-neutral-500 sm:rounded-[1.6rem]">
                Add your location details to generate the wallpaper URL.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-950/85 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Shortcut Flow</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-300">
            <li>Action: `URL` and paste the generated wallpaper URL.</li>
            <li>Action: `Get Contents of URL`.</li>
            <li>Action: `Set Wallpaper` and choose Lock Screen.</li>
            <li>Disable `Show Preview` and `Crop to Subject`.</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
