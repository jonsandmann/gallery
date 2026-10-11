import { useEffect, useState, type ComponentType } from "react";
import Screen0 from "./components/SystemLoad";
import Screen1 from "./components/StorageFleet";

const SCREENS: { name: string; Component: ComponentType; width: number; height: number }[] = [
  { name: "System Load & Generation", Component: Screen0, width: 1440, height: 960 },
  { name: "Storage Fleet", Component: Screen1, width: 1440, height: 960 },
];
const GUTTER = 24;
const BAR = SCREENS.length > 1 ? 56 : 0;

// Each screen is designed at a fixed size; smaller windows see the whole of it, scaled down.
function fit(width: number, height: number) {
  return Math.min(1, (window.innerWidth - GUTTER * 2) / width, (window.innerHeight - GUTTER * 2 - BAR) / height);
}

function initialScreen() {
  const i = SCREENS.findIndex((s) => s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === location.hash.slice(1));
  return Math.max(0, i);
}

export default function App() {
  const [index, setIndex] = useState(initialScreen);
  const screen = SCREENS[index];
  const [scale, setScale] = useState(() => fit(screen.width, screen.height));
  useEffect(() => {
    const onResize = () => setScale(fit(screen.width, screen.height));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [screen]);
  const choose = (i: number) => {
    setIndex(i);
    history.replaceState(null, "", "#" + SCREENS[i].name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  };
  const { Component } = screen;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0c0e]" style={{ padding: GUTTER }}>
      {SCREENS.length > 1 && (
        <nav className="mb-4 flex gap-1 rounded-full bg-white/10 p-1 font-sans text-sm" aria-label="Screens">
          {SCREENS.map((s, i) => (
            <button key={s.name} type="button" onClick={() => choose(i)} aria-current={i === index ? "page" : undefined}
              className={"rounded-full px-4 py-1.5 transition-colors " + (i === index ? "bg-white text-black" : "text-white/70 hover:text-white")}>
              {s.name}
            </button>
          ))}
        </nav>
      )}
      <div style={{ width: screen.width * scale, height: screen.height * scale }}>
        <div className="overflow-hidden rounded-xl shadow-2xl" style={{ width: screen.width, height: screen.height, transform: `scale(${scale})`, transformOrigin: "top left", display: "grid" }}>
          <Component key={screen.name} />
        </div>
      </div>
    </div>
  );
}
