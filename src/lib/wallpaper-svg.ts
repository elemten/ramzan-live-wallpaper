import type { LifeWallpaperConfig, RamadanWallpaperConfig } from "@/lib/wallpaper-config";
import type { RamadanTimings } from "@/lib/ramadan-data";
import { createThemeMotif, getRamadanThemeTokens } from "@/lib/ramadan-theme";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LIFE_EXPECTANCY_YEARS = 100;

interface RenderOptions {
  width: number;
  height: number;
  now: Date;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dateLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  }).format(date);
}

function timeLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

function toUtcDayStamp(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = new Map(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(lookup.get("year")), Number(lookup.get("month")) - 1, Number(lookup.get("day")));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createLifeWallpaperSvg(config: LifeWallpaperConfig, options: RenderOptions): string {
  const cols = 52;
  const rows = LIFE_EXPECTANCY_YEARS;
  const totalWeeks = rows * cols;
  const [y, m, d] = config.dateOfBirth.split("-").map(Number);
  const birthStamp = Date.UTC(y, m - 1, d);
  const todayStamp = toUtcDayStamp(options.now, config.timeZone);
  const elapsedDays = Math.floor((todayStamp - birthStamp) / MS_PER_DAY);
  const weeksLived = clamp(Math.floor(Math.max(elapsedDays, 0) / 7), 0, totalWeeks);
  const currentWeek = clamp(weeksLived - 1, 0, totalWeeks - 1);

  const gridWidthLimit = options.width * 0.82;
  const gridHeightLimit = options.height * 0.47;
  const unit = Math.min(gridWidthLimit / cols, gridHeightLimit / rows);
  const dotSize = Math.max(3, unit * 0.65);
  const dotOffset = (unit - dotSize) / 2;

  const gridWidth = cols * unit;
  const gridLeft = (options.width - gridWidth) / 2;
  const gridTop = options.height * 0.372;

  const dots: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const idx = row * cols + col;
      const x = gridLeft + col * unit + dotOffset;
      const yPos = gridTop + row * unit + dotOffset;
      const radius = Math.max(1.8, dotSize * 0.18);
      const isDone = idx < weeksLived;
      const isCurrent = idx === currentWeek && weeksLived > 0;
      const fill = isCurrent ? "#8d9299" : isDone ? "#e6e8ec" : "#050608";
      const stroke = isDone ? "none" : "#2a2d32";

      dots.push(
        `<rect x="${x.toFixed(2)}" y="${yPos.toFixed(2)}" width="${dotSize.toFixed(2)}" height="${dotSize.toFixed(
          2,
        )}" rx="${radius.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" />`,
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${options.width}" y2="${options.height}">
      <stop offset="0%" stop-color="#030405" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <style>
      .top-date { font: 700 ${Math.round(options.width * 0.053)}px "SF Pro Display", "Avenir Next", sans-serif; fill: #7a7d83; text-anchor: middle; }
      .clock { font: 680 ${Math.round(options.width * 0.335)}px "SF Pro Display", "Avenir Next Condensed", sans-serif; fill: #4b4f55; text-anchor: middle; letter-spacing: 2px; }
      .title { font: 520 ${Math.round(options.width * 0.056)}px "SF Pro Display", "Avenir Next", sans-serif; fill: #f1f3f7; text-anchor: middle; letter-spacing: 8px; }
      .meta { font: 500 ${Math.round(options.width * 0.022)}px "SF Pro Text", "Avenir Next", sans-serif; fill: #676d75; text-anchor: middle; }
    </style>
  </defs>
  <rect x="0" y="0" width="${options.width}" height="${options.height}" fill="url(#bg)" />
  <text x="${(options.width / 2).toFixed(2)}" y="${(options.height * 0.098).toFixed(2)}" class="top-date">${escapeXml(
    dateLabel(options.now, config.timeZone),
  )}</text>
  <text x="${(options.width / 2).toFixed(2)}" y="${(options.height * 0.257).toFixed(2)}" class="clock">${escapeXml(
    timeLabel(options.now, config.timeZone),
  )}</text>
  <text x="${(options.width / 2).toFixed(2)}" y="${(options.height * 0.312).toFixed(2)}" class="title">${escapeXml(
    config.title,
  )}</text>
  <text x="${(options.width / 2).toFixed(2)}" y="${(options.height * 0.336).toFixed(2)}" class="meta">${weeksLived.toLocaleString(
    "en-US",
  )} of ${totalWeeks.toLocaleString("en-US")} weeks lived</text>
  ${dots.join("")}
</svg>`;
}

function to12HourLabel(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return value;
  }

  const hour24 = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour24)) {
    return value;
  }

  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

export function createRamadanWallpaperSvg(
  config: RamadanWallpaperConfig,
  timings: RamadanTimings,
  options: RenderOptions,
): string {
  const theme = getRamadanThemeTokens(config.theme);
  const isRosePink = config.theme === "girly";
  const hijriLine = escapeXml(timings.hijriDate);
  const dayLine = "رمضان کریم";
  const titleLine = escapeXml(config.title || "RAMADAN CALENDAR");

  const entries: Array<{ label: string; value: string; icon: string }> = [
    { label: "Sehri", value: timings.sehri, icon: "icon-sehri" },
    { label: "Fajr", value: timings.fajr, icon: "icon-fajr" },
    { label: "Zohar", value: timings.dhuhr, icon: "icon-zohar" },
    { label: "Asr", value: timings.asr, icon: "icon-asr" },
    { label: "Maghrib", value: timings.maghrib, icon: "icon-maghrib" },
    { label: "Isha", value: timings.isha, icon: "icon-isha" },
  ];

  const panelWidth = isRosePink ? options.width * 0.87 : options.width * 0.928;
  const panelLeft = (options.width - panelWidth) / 2;
  const columnCount = isRosePink ? 2 : entries.length;
  const cardGapX = isRosePink ? options.width * 0.02 : options.width * 0.009;
  const cardGapY = isRosePink ? options.height * 0.016 : 0;
  const cardWidth = (panelWidth - cardGapX * (columnCount - 1)) / columnCount;
  const cardHeight = isRosePink ? options.height * 0.076 : options.height * 0.093;
  const cardTop = isRosePink ? options.height * 0.565 : options.height * 0.572;

  const rowCenterY = cardTop + cardHeight / 2;
  const iconSize = isRosePink
    ? Math.min(cardWidth * 0.16, cardHeight * 0.45)
    : Math.min(cardWidth * 0.34, cardHeight * 0.22);
  const mosqueBaseSize = 512;
  const mosqueMaxWidth = isRosePink ? options.width * 0.72 : options.width * 0.78;
  const mosqueMaxHeight = isRosePink ? options.height * 0.24 : options.height * 0.29;
  const mosqueScale = Math.min(mosqueMaxWidth / mosqueBaseSize, mosqueMaxHeight / mosqueBaseSize);
  const mosqueSize = mosqueBaseSize * mosqueScale;
  const mosqueBottomInset = isRosePink ? options.height * 0.006 : options.height * 0.012;
  const mosqueX = (options.width - mosqueSize) / 2;
  const mosqueY = options.height - mosqueSize - mosqueBottomInset;
  const decorativeLayer = createThemeMotif(config.theme, options.width, options.height);

  const columns = entries
    .map((entry, idx) => {
      const row = isRosePink ? Math.floor(idx / columnCount) : 0;
      const col = isRosePink ? idx % columnCount : idx;
      const x = panelLeft + col * (cardWidth + cardGapX);
      const y = cardTop + row * (cardHeight + cardGapY);
      const iconX = isRosePink ? x + cardWidth * 0.08 : x + (cardWidth - iconSize) / 2;
      const iconBaseY = isRosePink ? y + (cardHeight - iconSize) / 2 : y + cardHeight * 0.13;
      const iconOffsetY =
        entry.label === "Fajr" || entry.label === "Maghrib"
          ? cardHeight * 0.012
          : entry.label === "Sehri" || entry.label === "Zohar" || entry.label === "Asr"
            ? cardHeight * 0.006
            : 0;
      const iconY = iconBaseY + iconOffsetY;
      const labelX = isRosePink ? x + cardWidth * 0.24 : x + cardWidth / 2;
      const labelY = isRosePink ? y + cardHeight * 0.59 : y + cardHeight * 0.58;
      const valueX = isRosePink ? x + cardWidth * 0.92 : x + cardWidth / 2;
      const valueY = isRosePink ? y + cardHeight * 0.59 : y + cardHeight * 0.83;
      const labelClass = isRosePink ? "row-label" : "col-label";
      const valueClass = isRosePink ? "row-value" : "col-value";

      return `
      <g transform="translate(${x.toFixed(2)}, ${y.toFixed(2)})">
        <rect width="${cardWidth.toFixed(2)}" height="${cardHeight.toFixed(
          2,
        )}" rx="${(cardWidth * theme.card.outerRadiusScale).toFixed(
          2,
        )}" fill="url(#card)" stroke="url(#goldBorder)" stroke-width="${theme.card.borderWidth}" filter="url(#cardGlow)"/>
        <rect x="2" y="2" width="${(cardWidth - 4).toFixed(2)}" height="${(cardHeight - 4).toFixed(
          2,
        )}" rx="${(cardWidth * theme.card.innerRadiusScale).toFixed(2)}" fill="none" stroke="${theme.card.innerStroke}" stroke-opacity="${theme.card.innerStrokeOpacity}" stroke-width="1"/>
      </g>
      <use href="#${entry.icon}" x="${iconX.toFixed(2)}" y="${iconY.toFixed(2)}" width="${iconSize.toFixed(
        2,
      )}" height="${iconSize.toFixed(2)}" class="icon-line" />
      <text x="${labelX.toFixed(2)}" y="${labelY.toFixed(2)}" class="${labelClass}">${escapeXml(
        entry.label,
      )}</text>
      <text x="${valueX.toFixed(2)}" y="${valueY.toFixed(2)}" class="${valueClass}">${escapeXml(
        to12HourLabel(entry.value),
      )}</text>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgMain" x1="0" y1="0" x2="${options.width}" y2="${options.height}">
      <stop offset="0%" stop-color="${theme.background.start}" />
      <stop offset="50%" stop-color="${theme.background.mid}" />
      <stop offset="100%" stop-color="${theme.background.end}" />
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stop-color="${theme.vignette.inner}" stop-opacity="${theme.vignette.innerOpacity}" />
      <stop offset="68%" stop-color="${theme.vignette.mid}" stop-opacity="${theme.vignette.midOpacity}" />
      <stop offset="100%" stop-color="${theme.vignette.outer}" stop-opacity="${theme.vignette.outerOpacity}" />
    </radialGradient>
    <pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="transparent" />
      <circle cx="1" cy="1" r="0.45" fill="${theme.grain.a}" fill-opacity="${theme.grain.aOpacity}" />
      <circle cx="6" cy="2" r="0.4" fill="${theme.grain.b}" fill-opacity="${theme.grain.bOpacity}" />
      <circle cx="3" cy="5" r="0.5" fill="${theme.grain.c}" fill-opacity="${theme.grain.cOpacity}" />
      <circle cx="7" cy="7" r="0.35" fill="${theme.grain.d}" fill-opacity="${theme.grain.dOpacity}" />
    </pattern>
    <linearGradient id="card" x1="0" y1="0" x2="${panelWidth}" y2="${cardHeight}">
      <stop offset="0%" stop-color="${theme.card.start}" />
      <stop offset="100%" stop-color="${theme.card.end}" />
    </linearGradient>
    <linearGradient id="goldBorder" x1="0" y1="0" x2="${panelWidth}" y2="0">
      <stop offset="0%" stop-color="${theme.card.borderStart}" />
      <stop offset="50%" stop-color="${theme.card.borderMid}" />
      <stop offset="100%" stop-color="${theme.card.borderEnd}" />
    </linearGradient>
    <linearGradient id="goldText" x1="0" y1="0" x2="${options.width}" y2="0">
      <stop offset="0%" stop-color="${theme.text.goldStart}" />
      <stop offset="50%" stop-color="${theme.text.goldMid}" />
      <stop offset="100%" stop-color="${theme.text.goldEnd}" />
    </linearGradient>
    <filter id="cardGlow" x="-12%" y="-12%" width="124%" height="124%">
      <feGaussianBlur stdDeviation="${theme.card.glowStdDeviation}" />
      <feColorMatrix
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${theme.card.glowOpacity} 0"
      />
    </filter>

    <symbol id="icon-sehri" viewBox="0 0 24 24">
      <path d="M3 16.5h18" />
      <path d="M5.4 16.5a6.6 6.6 0 0 1 13.2 0" />
      <path d="M12 6.4v2.2" />
      <path d="M8.2 8.1l1.1 1.1" />
      <path d="M15.8 8.1l-1.1 1.1" />
      <path d="M4.4 19.3h15.2" />
    </symbol>
    <symbol id="icon-fajr" viewBox="0 0 24 24">
      <path d="M12 3.5v4.2" />
      <path d="M8.1 7.5L12 3.5l3.9 4" />
      <path d="M7.5 20a4.5 4.5 0 0 1 9 0" />
      <path d="M5.4 11.2l1.4 1.4" />
      <path d="M18.6 11.2l-1.4 1.4" />
      <path d="M3 20h18" />
    </symbol>
    <symbol id="icon-zohar" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 2.8v3" />
      <path d="M12 18.2v3" />
      <path d="M2.8 12h3" />
      <path d="M18.2 12h3" />
      <path d="M5.5 5.5l2.1 2.1" />
      <path d="M16.4 16.4l2.1 2.1" />
      <path d="M18.5 5.5l-2.1 2.1" />
      <path d="M7.6 16.4l-2.1 2.1" />
    </symbol>
    <symbol id="icon-asr" viewBox="0 0 24 24">
      <path d="M3 17.8h18" />
      <path d="M6 17.8a6 6 0 0 1 12 0" />
      <path d="M12 7v2.2" />
      <path d="M8.2 9l1.1 1.1" />
      <path d="M15.8 9l-1.1 1.1" />
      <path d="M5.2 12.2h2.2" />
      <path d="M16.6 12.2h2.2" />
    </symbol>
    <symbol id="icon-maghrib" viewBox="0 0 24 24">
      <path d="M12 10V2" />
      <path d="M5.2 11.2l1.4 1.4" />
      <path d="M2 18h2" />
      <path d="M20 18h2" />
      <path d="M17.4 12.6l1.4-1.4" />
      <path d="M22 22H2" />
      <path d="M16 6l-4 4-4-4" />
      <path d="M16 18a4 4 0 00-8 0" />
    </symbol>
    <symbol id="icon-isha" viewBox="0 0 24 24">
      <path d="M16.2 4.4a7.4 7.4 0 1 0 0 15.2a6.5 6.5 0 0 1-4.5-7.6a6.5 6.5 0 0 1 4.5-7.6z" />
      <path d="M18.2 6.2l0.5 1.4l1.4 0.5l-1.4 0.5l-0.5 1.4l-0.5-1.4l-1.4-0.5l1.4-0.5z" />
    </symbol>

    <symbol id="mosque-outline" viewBox="0 0 512 512">
      <g fill="none" stroke="${theme.mosque.stroke}" stroke-width="${theme.mosque.width}" stroke-linecap="${theme.mosque.linecap}" stroke-linejoin="${theme.mosque.linejoin}" opacity="${theme.mosque.opacity}">
        <path d="M503.467,494.933H8.533c-4.71,0-8.533,3.823-8.533,8.533S3.823,512,8.533,512h494.933c4.719,0,8.533-3.823,8.533-8.533 S508.186,494.933,503.467,494.933z"/>
        <path d="M418.133,477.867c4.719,0,8.533-3.823,8.533-8.533v-307.2c0-4.71-3.814-8.533-8.533-8.533s-8.533,3.823-8.533,8.533 v162.133h-34.133v-8.533c0-4.71-3.814-8.533-8.533-8.533s-8.533,3.823-8.533,8.533V460.8h-34.133v-68.267 c0-37.641-30.626-68.267-68.267-68.267c-37.641,0-68.267,30.626-68.267,68.267V460.8H153.6V315.733 c0-4.71-3.823-8.533-8.533-8.533c-4.71,0-8.533,3.823-8.533,8.533v8.533H102.4V162.133c0-4.71-3.823-8.533-8.533-8.533 c-4.71,0-8.533,3.823-8.533,8.533v307.2c0,4.71,3.823,8.533,8.533,8.533c4.71,0,8.533-3.823,8.533-8.533v-128h34.133V460.8H128 c-4.71,0-8.533,3.823-8.533,8.533s3.823,8.533,8.533,8.533h256c4.719,0,8.533-3.823,8.533-8.533S388.719,460.8,384,460.8h-8.533 V341.333H409.6v128C409.6,474.044,413.414,477.867,418.133,477.867z M247.467,409.6c-4.71,0-8.533,3.823-8.533,8.533 s3.823,8.533,8.533,8.533V460.8H204.8v-68.267c0-25.318,18.492-46.344,42.667-50.432V409.6z M307.2,460.8h-42.667v-34.133 c4.719,0,8.533-3.823,8.533-8.533s-3.814-8.533-8.533-8.533v-67.499c24.175,4.087,42.667,25.114,42.667,50.432V460.8z"/>
        <path d="M443.733,196.267v17.067c0,4.71,3.814,8.533,8.533,8.533c4.719,0,8.533-3.823,8.533-8.533v-17.067 c0-4.71-3.814-8.533-8.533-8.533C447.548,187.733,443.733,191.556,443.733,196.267z"/>
        <path d="M17.067,162.133v307.2c0,4.71,3.823,8.533,8.533,8.533c4.71,0,8.533-3.823,8.533-8.533v-307.2 c0-4.71-3.823-8.533-8.533-8.533C20.89,153.6,17.067,157.423,17.067,162.133z"/>
        <path d="M418.133,136.533H486.4c3.234,0,6.187-1.826,7.629-4.719c15.172-30.336-8.107-59.273-23.501-78.421 c-4.565-5.666-8.866-11.017-10.624-14.541c-2.901-5.786-12.373-5.786-15.275,0c-1.758,3.524-6.067,8.875-10.624,14.541 c-15.394,19.149-38.673,48.085-23.509,78.421C411.947,134.707,414.899,136.533,418.133,136.533z M447.309,64.085 c1.741-2.167,3.413-4.241,4.958-6.229c1.545,1.988,3.217,4.062,4.958,6.229c13.09,16.282,29.15,36.233,23.415,55.381h-56.747 C418.159,100.318,434.219,80.367,447.309,64.085z"/>
        <path d="M486.4,153.6c-4.719,0-8.533,3.823-8.533,8.533v307.2c0,4.71,3.814,8.533,8.533,8.533s8.533-3.823,8.533-8.533v-307.2 C494.933,157.423,491.119,153.6,486.4,153.6z"/>
        <path d="M25.6,136.533h68.267c3.234,0,6.187-1.826,7.637-4.719c15.164-30.336-8.115-59.273-23.509-78.421 c-4.565-5.666-8.866-11.017-10.633-14.541c-2.884-5.786-12.373-5.786-15.266,0c-1.758,3.524-6.067,8.875-10.624,14.541 c-15.394,19.149-38.673,48.085-23.509,78.421C19.413,134.707,22.366,136.533,25.6,136.533z M54.775,64.085 c1.741-2.167,3.413-4.241,4.958-6.229c1.545,1.988,3.209,4.062,4.958,6.229c13.099,16.282,29.15,36.233,23.415,55.381H31.36 C25.626,100.318,41.677,80.367,54.775,64.085z"/>
        <path d="M179.2,256c4.71,0,8.533-3.823,8.533-8.533V230.4c0-4.71-3.823-8.533-8.533-8.533s-8.533,3.823-8.533,8.533v17.067 C170.667,252.177,174.49,256,179.2,256z"/>
        <path d="M51.2,196.267v17.067c0,4.71,3.823,8.533,8.533,8.533s8.533-3.823,8.533-8.533v-17.067c0-4.71-3.823-8.533-8.533-8.533 S51.2,191.556,51.2,196.267z"/>
        <path d="M145.067,290.133h221.867c3.849,0,7.219-2.577,8.235-6.289c18.27-67.021-24.653-102.895-62.524-134.545 c-19.081-15.949-37.069-31.07-48.111-49.357V67.055c5.743-1.476,11.059-4.318,15.386-8.585c3.354-3.302,3.405-8.704,0.094-12.066 c-3.294-3.362-8.713-3.405-12.066-0.094c-3.208,3.149-7.45,4.89-11.947,4.89c-9.412,0-17.067-7.654-17.067-17.067 c0-9.412,7.654-17.067,17.067-17.067c4.71,0,8.533-3.823,8.533-8.533S260.71,0,256,0c-18.825,0-34.133,15.309-34.133,34.133 c0,15.855,10.923,29.107,25.6,32.922v32.887c-11.042,18.287-29.03,33.408-48.111,49.357 c-37.871,31.65-80.802,67.524-62.524,134.545C137.847,287.556,141.218,290.133,145.067,290.133z M210.304,162.389 c16.418-13.722,33.297-27.827,45.696-44.493c12.399,16.666,29.278,30.771,45.696,44.493 c35.831,29.943,69.743,58.283,58.539,110.677H151.765C140.561,220.672,174.473,192.333,210.304,162.389z"/>
        <path d="M230.4,256c4.71,0,8.533-3.823,8.533-8.533V230.4c0-4.71-3.823-8.533-8.533-8.533s-8.533,3.823-8.533,8.533v17.067 C221.867,252.177,225.69,256,230.4,256z"/>
        <path d="M281.6,256c4.719,0,8.533-3.823,8.533-8.533V230.4c0-4.71-3.814-8.533-8.533-8.533c-4.719,0-8.533,3.823-8.533,8.533 v17.067C273.067,252.177,276.881,256,281.6,256z"/>
        <path d="M332.8,256c4.719,0,8.533-3.823,8.533-8.533V230.4c0-4.71-3.814-8.533-8.533-8.533c-4.719,0-8.533,3.823-8.533,8.533 v17.067C324.267,252.177,328.081,256,332.8,256z"/>
      </g>
    </symbol>

    <style>
      .header-title { font: 600 ${Math.round(options.width * 0.062)}px "Cinzel", "Times New Roman", serif; fill: url(#goldText); text-anchor: middle; letter-spacing: 0.7px; }
      .header-sub { font: 500 ${Math.round(options.width * 0.032)}px "Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", "Arial Unicode MS", serif; fill: ${theme.text.headerSub}; text-anchor: middle; opacity: 0.84; letter-spacing: 0; direction: rtl; unicode-bidi: plaintext; }
      .mode-title { font: 500 ${Math.round(options.width * 0.026)}px "Cinzel", "Times New Roman", serif; fill: ${theme.text.modeTitle}; text-anchor: middle; letter-spacing: 2.2px; opacity: 0.9; }
      .col-label { font: 560 ${Math.round(options.width * 0.027)}px "Cinzel", "Times New Roman", serif; fill: ${theme.text.colLabel}; text-anchor: middle; letter-spacing: 0.15px; }
      .col-value { font: 680 ${Math.round(options.width * 0.031)}px "Cinzel", "Times New Roman", serif; fill: ${theme.text.colValue}; text-anchor: middle; letter-spacing: 0.12px; }
      .row-label { font: 560 ${Math.round(options.width * 0.029)}px "Cinzel", "Times New Roman", serif; fill: ${theme.text.colLabel}; text-anchor: start; letter-spacing: 0.1px; }
      .row-value { font: 640 ${Math.round(options.width * 0.028)}px "Cinzel", "Times New Roman", serif; fill: ${theme.text.colValue}; text-anchor: end; letter-spacing: 0.08px; }
      .icon-line { fill: none; stroke: ${theme.iconStroke}; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
      .theme-crescent { color: ${theme.motif.crescentColor}; opacity: ${theme.motif.crescentOpacity}; }
      .theme-star { color: ${theme.motif.starColor}; opacity: ${theme.motif.starOpacity}; }
    </style>
  </defs>
  <rect x="0" y="0" width="${options.width}" height="${options.height}" fill="url(#bgMain)" />
  <rect x="0" y="0" width="${options.width}" height="${options.height}" fill="url(#vignette)" />
  <rect x="0" y="0" width="${options.width}" height="${options.height}" fill="url(#grain)" />
  ${decorativeLayer}

  <text x="${(options.width / 2).toFixed(2)}" y="${(rowCenterY - options.height * (isRosePink ? 0.175 : 0.142)).toFixed(
    2,
  )}" class="mode-title">${titleLine}</text>
  <text x="${(options.width / 2).toFixed(2)}" y="${(rowCenterY - options.height * (isRosePink ? 0.136 : 0.104)).toFixed(
    2,
  )}" class="header-title">${hijriLine}</text>
  <text x="${(options.width / 2).toFixed(2)}" y="${(rowCenterY - options.height * (isRosePink ? 0.104 : 0.072)).toFixed(
    2,
  )}" class="header-sub">${dayLine}</text>
  ${columns}

  <g transform="translate(${mosqueX.toFixed(2)}, ${mosqueY.toFixed(2)}) scale(${mosqueScale.toFixed(5)})">
    <use href="#mosque-outline" width="512" height="512" />
  </g>
</svg>`;
}
