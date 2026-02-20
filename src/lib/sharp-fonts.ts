import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

let configured = false;

function fontConfigXml(fontDir: string): string {
  return `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontDir}</dir>
  <cachedir>/tmp/fontconfig/cache</cachedir>
  <config></config>
</fontconfig>
`;
}

export async function ensureSharpFontConfig(): Promise<void> {
  if (configured) {
    return;
  }

  const fontDir = path.join(process.cwd(), "src/lib/fonts");
  const fontConfigDir = "/tmp/fontconfig";
  const cacheDir = path.join(fontConfigDir, "cache");
  const configPath = path.join(fontConfigDir, "fonts.conf");

  await mkdir(cacheDir, { recursive: true });
  await writeFile(configPath, fontConfigXml(fontDir), "utf8");

  process.env.FONTCONFIG_PATH = fontConfigDir;
  process.env.FONTCONFIG_FILE = configPath;
  process.env.XDG_CACHE_HOME = "/tmp";

  configured = true;
}

