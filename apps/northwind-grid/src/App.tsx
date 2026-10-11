import { useEffect, useState } from "react";
import SystemLoad from "./components/SystemLoad";

// The screen is designed at a fixed 1440 x 960; smaller windows see the whole of it, scaled down.
const WIDTH = 1440;
const HEIGHT = 960;
const GUTTER = 24;

function fit() {
  return Math.min(1, (window.innerWidth - GUTTER * 2) / WIDTH, (window.innerHeight - GUTTER * 2) / HEIGHT);
}

export default function App() {
  const [scale, setScale] = useState(fit);
  useEffect(() => {
    const onResize = () => setScale(fit());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return (
    <div className="grid min-h-screen place-items-center bg-[#07080a]" style={{ padding: GUTTER }}>
      <div style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
        <div className="overflow-hidden rounded-xl shadow-2xl" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left", display: "grid" }}>
          <SystemLoad />
        </div>
      </div>
    </div>
  );
}
