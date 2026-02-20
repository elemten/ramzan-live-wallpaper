# iOS Calendar Wallpaper Generator

Next.js app for two dynamic lock-screen wallpaper modes:

- `Life Calendar`: week grid life progress (fixed to 100 years)
- `Ramadan Calendar`: Hijri day + city prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha, Sehri, Iftar)

Both modes are stateless and Vercel-ready. No database is required.

## Why No Database

Each generated link includes an encoded token with config (mode + timezone + city/coords or DOB).  
The wallpaper endpoint decodes token and renders image on each request, so one link stays dynamic daily.

## APIs

- `POST /api/token`
  - Input:
    - Life: `{ mode: "life", dateOfBirth, timeZone, title }`
    - Ramadan: `{ mode: "ramadan", city, title }`
    - Ramadan exact: `{ mode: "ramadan", latitude, longitude, timeZone, calculationMethod, title }`
  - Output: `token`, `wallpaperUrl`, `setupUrl`
- `GET /api/wallpaper/[token]?w=1290&h=2796`
  - Returns PNG wallpaper
  - Optional `at` query for testing a specific datetime

## External Data Sources

- Geocoding: Open-Meteo Geocoding API
- Prayer/Hijri data: AlAdhan Timings API
  - Uses `/v1/timings/{date}` with exact coordinates and configurable `method`

## Local Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## iOS Shortcut Setup

1. `URL` action with generated `wallpaperUrl`
2. `Get Contents of URL`
3. `Set Wallpaper` -> Lock Screen
4. Turn off preview/crop options

Automation:

- Life mode: fixed 12:00 PM daily
- Ramadan mode: fixed early time before Fajr (iOS cannot auto-shift trigger to exact daily Fajr from API)

## Deploy

1. Push repo to GitHub
2. Import to Vercel
3. Deploy with default Next.js settings
