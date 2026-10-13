"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cx } from "./ui";

const CHOIX = [
  { id: "clair", label: "Clair", Icone: Sun },
  { id: "sombre", label: "Sombre", Icone: Moon },
  { id: "systeme", label: "Automatique", Icone: Monitor },
];

export function ChoixTheme() {
  const [theme, setTheme] = useState("systeme");
  useEffect(() => {
    try {
      setTheme(localStorage.getItem("theme") ?? "systeme");
    } catch {}
  }, []);

  const appliquer = (t: string) => {
    setTheme(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
    const sombre = t === "sombre" || (t === "systeme" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", sombre);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {CHOIX.map(({ id, label, Icone }) => (
        <button
          key={id}
          type="button"
          onClick={() => appliquer(id)}
          aria-pressed={theme === id}
          className={cx(
            "flex min-h-12 items-center justify-center gap-2 rounded-md text-sm font-semibold ring-1 ring-inset transition-colors duration-150",
            theme === id ? "bg-fond text-accent ring-2 ring-accent" : "ring-trait hover:bg-fond",
          )}
        >
          <Icone className="h-4 w-4" strokeWidth={1.6} />
          {label}
        </button>
      ))}
    </div>
  );
}
