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

  function clearNotices() {
    setError(null);
    setCopyStatus(null);
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported on this browser. Enter latitude and longitude manually.");
      return;
    }

    clearNotices();
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
          "Could not access location. If you prefer not to allow permission, ask Siri \"What are my coordinates?\" and paste them.",
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

    clearNotices();
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
      setCopyStatus("Wallpaper URL copied.");
    } catch {
      setCopyStatus("Could not copy automatically. Please copy manually.");
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#3d2f18]/45 bg-[linear-gradient(145deg,rgba(7,12,24,0.96)_0%,rgba(5,9,19,0.97)_52%,rgba(3,6,13,0.98)_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.58)]">
        <div className="pointer-events-none absolute -left-32 top-[-7rem] h-72 w-72 rounded-full bg-[#c29a5b]/9 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-[-6rem] h-72 w-72 rounded-full bg-[#1f3762]/35 blur-3xl" />

        <div className="relative grid gap-7 p-4 sm:p-7 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10 lg:p-9">
          <section className="rounded-[1.6rem] border border-[#4f3c1f]/42 bg-[#060d1c]/82 p-5 shadow-[inset_0_0_0_1px_rgba(169,132,72,0.12)] sm:p-7">
            <p className="text-[9px] uppercase tracking-[0.42em] text-[#997747]">Live iOS Wallpaper</p>
            <h1 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold leading-[0.98] text-[#f3dec0] sm:text-5xl">
              Ramadan Wallpaper Generator
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cdbb9e] sm:text-base">
              One mode only: Ramadan calendar. Generate a dynamic wallpaper URL from exact coordinates and use it in
              iOS Shortcuts.
            </p>

            <div className="mt-7 rounded-2xl border border-[#5a4322]/55 bg-[#09152b]/75 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#a38251]">Calendar Type</p>
              <h2 className="mt-2 font-[var(--font-heading)] text-2xl text-[#f0d7b2] sm:text-3xl">Ramadan Calendar</h2>
              <p className="mt-2 text-sm text-[#c6b18f]">Daily Hijri + prayer times wallpaper based on your location.</p>
            </div>

            <div className="mt-6 grid gap-5">
              <div className="rounded-2xl border border-[#3b2f1e]/55 bg-[#050b17]/70 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#7f6235] bg-[#0e1a31] px-4 text-sm font-semibold text-[#f0d7b0] transition hover:border-[#b9935b] hover:bg-[#142744] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLocating ? "Locating..." : "Use My Current Location"}
                  </button>
                  <p className="text-xs leading-5 text-[#b39a72]">
                    If location is blocked, ask Siri &quot;What are my coordinates?&quot; and paste them below.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm text-[#cfb790]">Latitude (exact)</span>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="52.133200"
                    value={ramadanForm.latitude}
                    onChange={(event) => setRamadanForm((prev) => ({ ...prev, latitude: event.target.value }))}
                    className="h-12 rounded-xl border border-[#5e4725]/65 bg-[#09152b]/75 px-3 text-sm text-[#f7e5c9] outline-none transition placeholder:text-[#8a785a] focus:border-[#c39a5d] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.16)]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-[#cfb790]">Longitude (exact)</span>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="-106.670000"
                    value={ramadanForm.longitude}
                    onChange={(event) => setRamadanForm((prev) => ({ ...prev, longitude: event.target.value }))}
                    className="h-12 rounded-xl border border-[#5e4725]/65 bg-[#09152b]/75 px-3 text-sm text-[#f7e5c9] outline-none transition placeholder:text-[#8a785a] focus:border-[#c39a5d] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.16)]"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm text-[#cfb790]">Calculation method (optional)</span>
                <select
                  value={ramadanForm.calculationMethod}
                  onChange={(event) =>
                    setRamadanForm((prev) => ({ ...prev, calculationMethod: Number(event.target.value) }))
                  }
                  className="h-12 rounded-xl border border-[#5e4725]/65 bg-[#09152b]/75 px-3 text-sm text-[#f6e1c2] outline-none transition focus:border-[#c39a5d] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.16)]"
                >
                  {CALC_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="h-[52px] w-full rounded-[0.95rem] border border-[#d4b17b]/80 bg-[linear-gradient(180deg,#F5D7A1_0%,#D4AF37_50%,#B8891E_100%)] text-sm font-bold tracking-[0.14em] text-[#1a1208] shadow-[0_8px_24px_rgba(212,175,55,0.18),inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isLoading ? "Generating..." : "Generate URL"}
              </button>
            </div>

            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

            {result ? (
              <div className="mt-6 rounded-2xl border border-[#5c4521]/55 bg-[#061228]/70 p-4 shadow-[inset_0_0_0_1px_rgba(188,147,83,0.18)] sm:p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#b18b52]">Wallpaper URL</p>
                <p className="mt-2 break-all rounded-xl border border-[#3f3119]/65 bg-[#040912]/75 p-3 font-mono text-xs leading-5 text-[#f4e2c5] sm:text-sm">
                  {result.wallpaperUrl}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    disabled={isCopying}
                    className="inline-flex h-10 items-center rounded-lg border border-[#7f6235]/75 bg-[#0d172c] px-3 text-xs font-semibold tracking-[0.08em] text-[#f0d8b2] transition hover:border-[#c69e60] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isCopying ? "Copying..." : "Copy URL"}
                  </button>
                  <a
                    href={result.setupUrl}
                    className="inline-flex h-10 items-center rounded-lg border border-[#7f6235]/75 bg-[#0d172c] px-3 text-xs font-semibold tracking-[0.08em] text-[#f0d8b2] transition hover:border-[#c69e60]"
                  >
                    Open setup page
                  </a>
                </div>
                {copyStatus ? <p className="mt-3 text-xs text-[#dac294]">{copyStatus}</p> : null}
              </div>
            ) : null}
          </section>

          <section className="grid gap-5 sm:gap-6">
            <article className="rounded-[1.6rem] border border-[#4a391f]/45 bg-[#071226]/85 p-4 shadow-[inset_0_0_0_1px_rgba(181,141,78,0.12)] sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#ab8751]">Live Preview</p>
              <div className="relative mt-4 overflow-hidden rounded-[2rem] border border-[#3f3019]/60 bg-[#02050b] p-2 shadow-[0_22px_55px_rgba(0,0,0,0.48)] sm:p-3">
                <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-9 w-32 -translate-x-1/2 rounded-b-2xl bg-black/75 blur-[1px]" />
                <div className="pointer-events-none absolute inset-x-5 top-3 z-10 h-12 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0))] blur-xl" />
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Generated wallpaper preview"
                    width={1290}
                    height={2796}
                    unoptimized
                    className="h-auto w-full rounded-[1.45rem]"
                  />
                ) : (
                  <div className="grid aspect-[9/19.5] place-items-center rounded-[1.45rem] bg-[radial-gradient(circle_at_50%_24%,rgba(191,152,90,0.2)_0%,rgba(20,32,57,0.5)_40%,#03070f_86%)] px-6 text-center text-sm leading-6 text-[#b7a079]">
                    Generate your URL to preview today&apos;s Ramadan wallpaper instantly.
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-[1.6rem] border border-[#4a391f]/45 bg-[#071226]/85 p-5 shadow-[inset_0_0_0_1px_rgba(181,141,78,0.12)] sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#ab8751]">Shortcut Steps</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#dbc8a8]">
                <li>Add `URL` action and paste the generated wallpaper URL.</li>
                <li>Add `Get Contents of URL` action.</li>
                <li>Add `Set Wallpaper` and choose Lock Screen.</li>
                <li>Disable `Show Preview` and `Crop to Subject`.</li>
              </ol>
            </article>

            <article className="rounded-[1.6rem] border border-[#4a391f]/45 bg-[#071226]/85 p-5 shadow-[inset_0_0_0_1px_rgba(181,141,78,0.12)] sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#ab8751]">Android Steps</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#dbc8a8]">
                <li>Install `Tasker` (recommended) or `MacroDroid` from Play Store.</li>
                <li>Create a daily automation at your preferred time.</li>
                <li>Add an `HTTP GET` step and paste this same generated wallpaper URL.</li>
                <li>Save the image as `/Download/ramadan-wallpaper.png`.</li>
                <li>Add `Set Wallpaper` and choose Lock Screen (or Both).</li>
                <li>Allow app permissions and disable battery optimization.</li>
              </ol>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
