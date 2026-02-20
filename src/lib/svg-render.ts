import path from "node:path";

import { Resvg } from "@resvg/resvg-js";

const FONT_DIR = path.join(process.cwd(), "src/lib/fonts");

const FONT_FILES = [
  path.join(FONT_DIR, "Cinzel-Variable.ttf"),
  path.join(FONT_DIR, "NotoSans-Variable.ttf"),
  path.join(FONT_DIR, "NotoNaskhArabic-Variable.ttf"),
];

interface RenderOptions {
  width: number;
}

export function renderSvgToPng(svg: string, options: RenderOptions): Buffer {
  const renderer = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: options.width,
    },
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: false,
      defaultFontFamily: "Noto Sans",
    },
  });

  return renderer.render().asPng();
}

