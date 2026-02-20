import WallpaperGenerator from "@/components/wallpaper-generator";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,_rgba(148,163,184,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(148,163,184,0.08),_transparent_32%)]" />
      <WallpaperGenerator />
    </main>
  );
}
