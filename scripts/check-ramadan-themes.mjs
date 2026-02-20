const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const sampleAt = process.env.SAMPLE_AT ?? "2026-03-01T22:30:00.000Z";

async function main() {
  const tokenResponse = await fetch(`${baseUrl}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "ramadan",
      city: "Current Location",
      latitude: 24.8607,
      longitude: 67.0011,
      timeZone: "Asia/Karachi",
      calculationMethod: 1,
      theme: "classic",
    }),
  });

  if (!tokenResponse.ok) {
    const message = await tokenResponse.text();
    throw new Error(`Token generation failed: ${tokenResponse.status} ${message}`);
  }

  const payload = await tokenResponse.json();
  const variants = payload?.variants;
  if (!variants?.classic?.wallpaperUrl || !variants?.girly?.wallpaperUrl) {
    throw new Error("Expected both classic and girly variants from /api/token.");
  }

  for (const theme of ["classic", "girly"]) {
    const url = new URL(variants[theme].wallpaperUrl);
    url.searchParams.set("at", sampleAt);
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      throw new Error(`${theme} wallpaper fetch failed: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get("content-type") ?? "";
    if (!contentType.includes("image/png")) {
      throw new Error(`${theme} wallpaper returned unexpected content-type: ${contentType}`);
    }

    console.log(`${theme}: ok -> ${url.toString()}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
