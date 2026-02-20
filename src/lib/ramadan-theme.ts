import type { RamadanTheme } from "@/lib/wallpaper-config";

export interface RamadanThemeTokens {
  id: RamadanTheme;
  background: {
    start: string;
    mid: string;
    end: string;
  };
  vignette: {
    inner: string;
    innerOpacity: number;
    mid: string;
    midOpacity: number;
    outer: string;
    outerOpacity: number;
  };
  grain: {
    a: string;
    aOpacity: number;
    b: string;
    bOpacity: number;
    c: string;
    cOpacity: number;
    d: string;
    dOpacity: number;
  };
  card: {
    start: string;
    end: string;
    borderStart: string;
    borderMid: string;
    borderEnd: string;
    borderWidth: number;
    innerStroke: string;
    innerStrokeOpacity: number;
    outerRadiusScale: number;
    innerRadiusScale: number;
    glowColor: string;
    glowOpacity: number;
    glowStdDeviation: number;
  };
  text: {
    goldStart: string;
    goldMid: string;
    goldEnd: string;
    headerSub: string;
    modeTitle: string;
    colLabel: string;
    colValue: string;
  };
  iconStroke: string;
  mosque: {
    stroke: string;
    width: number;
    linecap: "round" | "square" | "butt";
    linejoin: "round" | "bevel" | "miter";
    opacity: number;
  };
  motif: {
    starColor: string;
    starOpacity: number;
    crescentColor: string;
    crescentOpacity: number;
  };
}

const CLASSIC_TOKENS: RamadanThemeTokens = {
  id: "classic",
  background: {
    start: "#030509",
    mid: "#071226",
    end: "#020307",
  },
  vignette: {
    inner: "#15294D",
    innerOpacity: 0.26,
    mid: "#070D1C",
    midOpacity: 0.14,
    outer: "#000000",
    outerOpacity: 0.55,
  },
  grain: {
    a: "#FFFFFF",
    aOpacity: 0.02,
    b: "#C8D4F2",
    bOpacity: 0.015,
    c: "#FFFFFF",
    cOpacity: 0.018,
    d: "#9CB2DD",
    dOpacity: 0.012,
  },
  card: {
    start: "#12213B",
    end: "#0A1426",
    borderStart: "#8D6C3B",
    borderMid: "#DAB887",
    borderEnd: "#8A6838",
    borderWidth: 1.35,
    innerStroke: "#D9BA86",
    innerStrokeOpacity: 0.11,
    outerRadiusScale: 0.14,
    innerRadiusScale: 0.12,
    glowColor: "#DAB887",
    glowOpacity: 0.08,
    glowStdDeviation: 1.1,
  },
  text: {
    goldStart: "#9A7742",
    goldMid: "#E1C28F",
    goldEnd: "#9A7742",
    headerSub: "#B89E70",
    modeTitle: "#AC946A",
    colLabel: "#C3A36D",
    colValue: "#F8EFD9",
  },
  iconStroke: "#C5A164",
  mosque: {
    stroke: "#B58E52",
    width: 3.6,
    linecap: "round",
    linejoin: "round",
    opacity: 0.94,
  },
  motif: {
    starColor: "#DAB887",
    starOpacity: 0,
    crescentColor: "#DAB887",
    crescentOpacity: 0,
  },
};

const GIRLY_TOKENS: RamadanThemeTokens = {
  id: "girly",
  background: {
    start: "#241327",
    mid: "#3A1C3F",
    end: "#160A1B",
  },
  vignette: {
    inner: "#6A3F78",
    innerOpacity: 0.3,
    mid: "#2A1332",
    midOpacity: 0.18,
    outer: "#07020A",
    outerOpacity: 0.56,
  },
  grain: {
    a: "#FFE9F5",
    aOpacity: 0.018,
    b: "#FFD5E6",
    bOpacity: 0.014,
    c: "#FFF3DE",
    cOpacity: 0.016,
    d: "#F3C8D9",
    dOpacity: 0.012,
  },
  card: {
    start: "#4A294F",
    end: "#2C1636",
    borderStart: "#D6AFC4",
    borderMid: "#F1D7C1",
    borderEnd: "#C38AA9",
    borderWidth: 1.2,
    innerStroke: "#F0C6D9",
    innerStrokeOpacity: 0.2,
    outerRadiusScale: 0.19,
    innerRadiusScale: 0.16,
    glowColor: "#F6C1D5",
    glowOpacity: 0.22,
    glowStdDeviation: 1.75,
  },
  text: {
    goldStart: "#D9A6BF",
    goldMid: "#F5DEC4",
    goldEnd: "#D9A6BF",
    headerSub: "#E8BFD3",
    modeTitle: "#D7ADC1",
    colLabel: "#F0CADB",
    colValue: "#FFF1E5",
  },
  iconStroke: "#F1C9DC",
  mosque: {
    stroke: "#E7BCD0",
    width: 4.6,
    linecap: "round",
    linejoin: "round",
    opacity: 0.9,
  },
  motif: {
    starColor: "#FCE3EF",
    starOpacity: 0.62,
    crescentColor: "#F6C8DB",
    crescentOpacity: 0.09,
  },
};

const RAMADAN_THEME_TOKENS: Record<RamadanTheme, RamadanThemeTokens> = {
  classic: CLASSIC_TOKENS,
  girly: GIRLY_TOKENS,
};

export function getRamadanThemeTokens(theme: RamadanTheme): RamadanThemeTokens {
  return RAMADAN_THEME_TOKENS[theme];
}

export function createThemeMotif(theme: RamadanTheme, width: number, height: number): string {
  if (theme !== "girly") {
    return "";
  }

  const crescentCx = width * 0.84;
  const crescentCy = height * 0.22;
  const crescentR = width * 0.102;
  const crescentInnerCx = crescentCx + width * 0.038;
  const crescentInnerCy = crescentCy - width * 0.008;
  const crescentInnerR = width * 0.086;

  return `
  <g>
    <circle class="theme-crescent" cx="${crescentCx.toFixed(2)}" cy="${crescentCy.toFixed(2)}" r="${crescentR.toFixed(
      2,
    )}" fill="currentColor" />
    <circle cx="${crescentInnerCx.toFixed(2)}" cy="${crescentInnerCy.toFixed(2)}" r="${crescentInnerR.toFixed(
      2,
    )}" fill="url(#bgMain)" />
    <path class="theme-star" d="M ${(width * 0.17).toFixed(2)} ${(height * 0.2).toFixed(2)} L ${(width * 0.178).toFixed(
      2,
    )} ${(height * 0.214).toFixed(2)} L ${(width * 0.186).toFixed(2)} ${(height * 0.2).toFixed(2)} L ${(
      width * 0.178
    ).toFixed(2)} ${(height * 0.186).toFixed(2)} Z" fill="currentColor" />
    <path class="theme-star" d="M ${(width * 0.24).toFixed(2)} ${(height * 0.14).toFixed(2)} L ${(width * 0.247).toFixed(
      2,
    )} ${(height * 0.152).toFixed(2)} L ${(width * 0.255).toFixed(2)} ${(height * 0.14).toFixed(2)} L ${(
      width * 0.247
    ).toFixed(2)} ${(height * 0.128).toFixed(2)} Z" fill="currentColor" />
    <path class="theme-star" d="M ${(width * 0.77).toFixed(2)} ${(height * 0.1).toFixed(2)} L ${(width * 0.777).toFixed(
      2,
    )} ${(height * 0.112).toFixed(2)} L ${(width * 0.785).toFixed(2)} ${(height * 0.1).toFixed(2)} L ${(
      width * 0.777
    ).toFixed(2)} ${(height * 0.088).toFixed(2)} Z" fill="currentColor" />
  </g>`;
}
