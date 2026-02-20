import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { decodeWallpaperToken } from "@/lib/token";

function themeDisplayName(theme: "classic" | "girly"): string {
  return theme === "girly" ? "Rose Pink" : "Navy Blue";
}

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
    <main className="relative isolate min-h-screen overflow-hidden bg-[#03060c] px-4 py-8 text-[#f3dfc1] sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(194,152,86,0.15),transparent_28%),radial-gradient(circle_at_85%_19%,rgba(24,46,80,0.45),transparent_36%),linear-gradient(180deg,#03060c_0%,#020409_65%,#02050a_100%)]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-[1.7rem] border border-[#4f3c20]/70 bg-[#061127]/85 p-5 shadow-[0_26px_60px_rgba(0,0,0,0.45)] sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#b28a52]">iOS Setup</p>
          <h1 className="mt-2 font-[var(--font-heading)] text-3xl sm:text-4xl">Ramadan Wallpaper Setup</h1>
          <p className="mt-3 text-sm leading-6 text-[#d6bf99] sm:text-base">
            This URL is dynamic. Use the same shortcut URL and it refreshes with the daily prayer data.
          </p>
        </header>

        <section className="rounded-[1.5rem] border border-[#4f3c20]/70 bg-[#081429]/85 p-5 shadow-[inset_0_0_0_1px_rgba(173,134,73,0.18)] sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b28a52]">Wallpaper URL</p>
          <p className="mt-3 break-all rounded-xl border border-[#403118] bg-[#040a14]/80 p-3 font-mono text-xs leading-5 text-[#f2dfc1] sm:text-sm">
            {wallpaperUrl}
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-[#4f3c20]/70 bg-[#081429]/85 p-5 shadow-[inset_0_0_0_1px_rgba(173,134,73,0.18)] sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b28a52]">Config Summary</p>
          <ul className="mt-3 space-y-2 text-sm text-[#decba9] sm:text-base">
            <li>Mode: Ramadan Calendar</li>
            {config.mode === "ramadan" ? (
              <>
                <li>Location label: {config.city}</li>
                <li>
                  Coordinates: {config.latitude.toFixed(6)}, {config.longitude.toFixed(6)}
                </li>
                <li>Calculation method: {config.calculationMethod}</li>
                <li>Theme: {themeDisplayName(config.theme)}</li>
              </>
            ) : (
              <li>This link uses a legacy non-Ramadan token.</li>
            )}
          </ul>
        </section>

        <section className="rounded-[1.5rem] border border-[#4f3c20]/70 bg-[#081429]/85 p-5 shadow-[inset_0_0_0_1px_rgba(173,134,73,0.18)] sm:p-6">
          <h2 className="font-[var(--font-heading)] text-2xl">Shortcut Steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#e3d3b7] sm:text-base">
            <li>Create a new Shortcut on iPhone.</li>
            <li>Add `URL` and paste the wallpaper URL.</li>
            <li>Add `Get Contents of URL`.</li>
            <li>Add `Set Wallpaper` and choose Lock Screen only.</li>
            <li>Disable `Show Preview` and `Crop to Subject`.</li>
          </ol>
        </section>

        <section className="rounded-[1.5rem] border border-[#4f3c20]/70 bg-[#081429]/85 p-5 shadow-[inset_0_0_0_1px_rgba(173,134,73,0.18)] sm:p-6">
          <h2 className="font-[var(--font-heading)] text-2xl">Automation</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#e3d3b7] sm:text-base">
            <li>Open Shortcuts → Automation → Personal Automation.</li>
            <li>Set a fixed daily time before Fajr in your city.</li>
            <li>Run your shortcut and disable `Ask Before Running`.</li>
          </ol>
        </section>

        <section className="rounded-[1.5rem] border border-[#4f3c20]/70 bg-[#081429]/85 p-5 shadow-[inset_0_0_0_1px_rgba(173,134,73,0.18)] sm:p-6">
          <h2 className="font-[var(--font-heading)] text-2xl">Android Setup</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#e3d3b7] sm:text-base">
            <li>Install `Tasker` (recommended) or `MacroDroid` from Play Store.</li>
            <li>Create a daily automation at your preferred time.</li>
            <li>Add an `HTTP GET` step and paste this same wallpaper URL.</li>
            <li>Save the image to `/Download/ramadan-wallpaper.png`.</li>
            <li>Add `Set Wallpaper` and choose Lock Screen (or Both).</li>
            <li>Allow permissions and disable battery optimization for reliability.</li>
          </ol>
        </section>

        <Link href="/" className="text-sm text-[#c9ac7b] underline underline-offset-4 hover:text-[#f2dfc1]">
          Back to generator
        </Link>
      </div>
    </main>
  );
}
