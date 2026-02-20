import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { decodeWallpaperToken } from "@/lib/token";

function buildOrigin(headerMap: Headers): string {
  const proto = headerMap.get("x-forwarded-proto") ?? "https";
  const host = headerMap.get("x-forwarded-host") ?? headerMap.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export default async function SetupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const config = decodeWallpaperToken(token);

  if (!config) {
    notFound();
  }

  const headerMap = await headers();
  const origin = buildOrigin(headerMap);
  const wallpaperUrl = `${origin}/api/wallpaper/${token}?w=1290&h=2796`;
  const modeLabel = config.mode === "life" ? "Life Calendar" : "Ramadan Calendar";

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-12 text-neutral-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">iOS Setup</p>
          <h1 className="text-4xl font-semibold tracking-tight">{modeLabel} Shortcut Setup</h1>
          <p className="text-neutral-400">
            The wallpaper URL below is dynamic. Same link updates every day automatically.
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <p className="text-sm text-neutral-500">Wallpaper URL</p>
          <p className="mt-1 break-all font-mono text-sm text-neutral-200">{wallpaperUrl}</p>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <p className="text-sm text-neutral-500">Config</p>
          {config.mode === "life" ? (
            <ul className="mt-2 space-y-2 text-sm text-neutral-300">
              <li>Mode: Life Calendar</li>
              <li>Date of birth: {config.dateOfBirth}</li>
              <li>Life expectancy: fixed to 100 years</li>
              <li>Time zone: {config.timeZone}</li>
            </ul>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-neutral-300">
              <li>Mode: Ramadan Calendar</li>
              <li>City: {config.city}</li>
              <li>Country: {config.country || "N/A"}</li>
              <li>
                Coordinates: {config.latitude.toFixed(4)}, {config.longitude.toFixed(4)}
              </li>
              <li>Time zone: {config.timeZone}</li>
              <li>Calculation method: {config.calculationMethod}</li>
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <h2 className="text-xl font-medium">Shortcut Steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-300">
            <li>Create a new Shortcut in iOS Shortcuts.</li>
            <li>Add `URL` action and paste the wallpaper URL above.</li>
            <li>Add `Get Contents of URL` action.</li>
            <li>Add `Set Wallpaper` action and select Lock Screen only.</li>
            <li>Disable `Show Preview` and `Crop to Subject`.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5">
          <h2 className="text-xl font-medium">Automation</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-300">
            <li>Open the Automation tab and create a Personal Automation.</li>
            <li>For life calendar, trigger at `12:00 PM` daily.</li>
            <li>For ramadan, use an early fixed time (for example `3:00 AM`) so times refresh before Fajr.</li>
            <li>Run your shortcut and disable `Ask Before Running`.</li>
          </ol>
          <p className="mt-3 text-xs text-neutral-500">
            iOS Personal Automation does not support dynamic daily trigger time from an API, so exact Fajr trigger
            cannot be auto-updated natively.
          </p>
        </section>

        <Link href="/" className="text-sm text-neutral-400 underline hover:text-neutral-200">
          Back to generator
        </Link>
      </div>
    </main>
  );
}
