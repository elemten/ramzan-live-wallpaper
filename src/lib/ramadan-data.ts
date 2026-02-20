export interface GeocodedCity {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export interface RamadanTimings {
  gregorianDate: string;
  hijriDate: string;
  hijriMonth: string;
  hijriDay: number;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sehri: string;
  iftar: string;
}

interface AlAdhanResponse {
  code: number;
  data?: {
    timings: {
      Fajr: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
    };
    date: {
      readable: string;
      hijri: {
        day: string;
        month: {
          en: string;
        };
        year: string;
      };
    };
  };
}

function cleanTime(value: string): string {
  const parsed = value.match(/\d{1,2}:\d{2}/);
  return parsed ? parsed[0] : value;
}

function isoDateInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function toDdMmYyyy(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function geocodeOnce(name: string): Promise<GeocodedCity | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name.trim());
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "life-calendar-wallpaper/1.0",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    results?: Array<{
      name: string;
      country: string;
      latitude: number;
      longitude: number;
      timezone: string;
    }>;
  };

  const first = data.results?.[0];
  if (!first) {
    return null;
  }

  return {
    city: titleCase(first.name),
    country: first.country,
    latitude: first.latitude,
    longitude: first.longitude,
    timeZone: first.timezone,
  };
}

export async function geocodeCity(query: string): Promise<GeocodedCity | null> {
  const normalized = query.trim();
  if (!normalized) {
    return null;
  }

  const direct = await geocodeOnce(normalized);
  if (direct) {
    return direct;
  }

  const commaPart = normalized.split(",")[0]?.trim();
  if (commaPart && commaPart !== normalized) {
    const byComma = await geocodeOnce(commaPart);
    if (byComma) {
      return byComma;
    }
  }

  const wordPart = normalized.split(/\s+/)[0]?.trim();
  if (wordPart && wordPart !== normalized) {
    return geocodeOnce(wordPart);
  }

  return null;
}

export async function getRamadanTimings(
  latitude: number,
  longitude: number,
  timeZone: string,
  calculationMethod: number,
  now: Date,
): Promise<RamadanTimings | null> {
  const isoDate = isoDateInTimeZone(now, timeZone);
  const url = new URL(`https://api.aladhan.com/v1/timings/${toDdMmYyyy(isoDate)}`);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("method", String(calculationMethod));
  url.searchParams.set("timezonestring", timeZone);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "life-calendar-wallpaper/1.0",
    },
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AlAdhanResponse;
  if (data.code !== 200 || !data.data) {
    return null;
  }

  const hijriDay = Number(data.data.date.hijri.day);
  const hijriYear = data.data.date.hijri.year;
  const hijriMonth = data.data.date.hijri.month.en;

  return {
    gregorianDate: data.data.date.readable,
    hijriDate: `${hijriDay} ${hijriMonth} ${hijriYear} AH`,
    hijriMonth,
    hijriDay,
    fajr: cleanTime(data.data.timings.Fajr),
    dhuhr: cleanTime(data.data.timings.Dhuhr),
    asr: cleanTime(data.data.timings.Asr),
    maghrib: cleanTime(data.data.timings.Maghrib),
    isha: cleanTime(data.data.timings.Isha),
    sehri: cleanTime(data.data.timings.Imsak),
    iftar: cleanTime(data.data.timings.Maghrib),
  };
}
