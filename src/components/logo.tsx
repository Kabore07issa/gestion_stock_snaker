import { BOUTIQUE } from "@/config";

// Mêmes tracés que scripts/logo.mjs (silhouette de sneaker, repère 64 × 40)
const TRACES = [
  "M7.5 32.5H56.5Q61 32.5 61 28.5Q61 24.6 55.5 23L45 20Q39.5 18.4 35 14.6L28 8.8Q25.6 6.9 23.4 9.1L20.6 12Q17.4 15.3 13 13.6Q8.4 11.9 6.6 16.4Q5 20.5 5 25.5V30Q5 32.5 7.5 32.5Z",
  "M5.2 27.5H60.6",
  "M27.6 12.6l-2.2 3M31.4 15.8l-2.2 3M35.4 18.6l-2 3",
  "M12.5 20.5Q21 23.2 30.6 22.7",
];

export function MarqueSneaker({ className = "", epaisseur = 1.7 }: { className?: string; epaisseur?: number }) {
  return (
    <svg
      viewBox="2 4 61 31"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {TRACES.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function Logo({ className = "", taille = "md" }: { className?: string; taille?: "sm" | "md" | "lg" }) {
  const t = {
    sm: { mark: "h-5 w-10", texte: "text-[15px]" },
    md: { mark: "h-6 w-12", texte: "text-[17px]" },
    lg: { mark: "h-9 w-[4.5rem]", texte: "text-2xl" },
  }[taille];
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <MarqueSneaker className={`${t.mark} shrink-0 text-accent`} />
      <span className={`${t.texte} font-extrabold tracking-tight text-encre`}>{BOUTIQUE.nom}</span>
    </span>
  );
}
