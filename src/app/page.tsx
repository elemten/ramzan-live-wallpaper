import WallpaperGenerator from "@/components/wallpaper-generator";

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#03060c]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(214,175,111,0.14),transparent_30%),radial-gradient(circle_at_83%_18%,rgba(23,43,74,0.45),transparent_40%),linear-gradient(180deg,#020409_0%,#03060d_52%,#02040a_100%)]" />
      <WallpaperGenerator />
    </main>
  );
}
