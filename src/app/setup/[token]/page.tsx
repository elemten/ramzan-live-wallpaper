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

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 sm:gap-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">iOS Setup</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {config.mode === "ramadan" ? "Ramadan Wallpaper Setup" : "Wallpaper Setup"}
          </h1>
          <p className="text-sm text-neutral-400 sm:text-base">
            The wallpaper URL below is dynamic. The same link refreshes the image every day.
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5">
          <p className="text-sm text-neutral-500">Wallpaper URL</p>
          <p className="mt-1 break-all font-mono text-xs text-neutral-200 sm:text-sm">{wallpaperUrl}</p>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5">
          <p className="text-sm text-neutral-500">Config Summary</p>
          {config.mode === "ramadan" ? (
            <ul className="mt-2 space-y-2 text-sm text-neutral-300">
              <li>Mode: Ramadan Calendar</li>
              <li>Location label: {config.city}</li>
              <li>
                Coordinates (exact): {config.latitude.toFixed(6)}, {config.longitude.toFixed(6)}
              </li>
              <li>Calculation method: {config.calculationMethod}</li>
            </ul>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-neutral-300">
              <li>Mode: Life Calendar (legacy token)</li>
              <li>Date of birth: {config.dateOfBirth}</li>
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5">
          <h2 className="text-lg font-medium sm:text-xl">Shortcut Steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-300">
            <li>Create a new Shortcut in iOS Shortcuts.</li>
            <li>Add `URL` action and paste the wallpaper URL above.</li>
            <li>Add `Get Contents of URL` action.</li>
            <li>Add `Set Wallpaper` action and select Lock Screen only.</li>
            <li>Disable `Show Preview` and `Crop to Subject`.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5">
          <h2 className="text-lg font-medium sm:text-xl">Automation</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-300">
            <li>Open the Automation tab and create a Personal Automation.</li>
            <li>Use an early fixed time (for example `3:00 AM`) so times refresh before Fajr.</li>
            <li>Run your shortcut and disable `Ask Before Running`.</li>
          </ol>
          <p className="mt-3 text-xs text-neutral-500">
            iOS Personal Automation does not support dynamic daily trigger times from an API.
          </p>
        </section>

        <Link href="/" className="text-sm text-neutral-400 underline hover:text-neutral-200">
          Back to generator
        </Link>
      </div>
    </main>
  );
}
