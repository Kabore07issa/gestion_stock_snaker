import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---------- Boutons ---------- */
type Variante = "primaire" | "secondaire" | "fantome" | "danger";
const VARIANTES: Record<Variante, string> = {
  primaire: "bg-accent text-accent-texte hover:bg-accent-hover",
  secondaire: "bg-fond text-encre ring-1 ring-inset ring-trait hover:bg-surface",
  fantome: "text-encre hover:bg-surface",
  danger: "bg-fond text-erreur ring-1 ring-inset ring-erreur/30 hover:bg-erreur/5",
};

export function classesBouton(v: Variante = "primaire", taille: "md" | "lg" | "sm" = "md", plein = false) {
  return cx(
    "inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50",
    taille === "sm" && "min-h-9 px-3 text-sm",
    taille === "md" && "min-h-11 px-4 text-[15px]",
    taille === "lg" && "min-h-14 px-6 text-base",
    plein && "w-full",
    VARIANTES[v],
  );
}

export function Bouton({
  variante = "primaire",
  taille = "md",
  plein,
  className,
  ...p
}: ComponentProps<"button"> & { variante?: Variante; taille?: "sm" | "md" | "lg"; plein?: boolean }) {
  return <button {...p} className={cx(classesBouton(variante, taille, plein), className)} />;
}

export function LienBouton({
  variante = "primaire",
  taille = "md",
  plein,
  className,
  ...p
}: ComponentProps<typeof Link> & { variante?: Variante; taille?: "sm" | "md" | "lg"; plein?: boolean }) {
  return <Link {...p} className={cx(classesBouton(variante, taille, plein), className)} />;
}

/* ---------- Champs ---------- */
export const classesChamp =
  "block w-full min-h-11 rounded-md border border-trait bg-fond px-3.5 text-[15px] text-encre placeholder:text-doux/70 transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15";

export function Champ({
  label,
  aide,
  className,
  ...p
}: ComponentProps<"input"> & { label: string; aide?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-encre">{label}</span>
      <input {...p} className={classesChamp} />
      {aide && <span className="mt-1 block text-xs text-doux">{aide}</span>}
    </label>
  );
}

export function Selecteur({
  label,
  className,
  children,
  ...p
}: ComponentProps<"select"> & { label: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-encre">{label}</span>
      <select {...p} className={cx(classesChamp, "appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9")} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235C7268' stroke-width='1.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
        {children}
      </select>
    </label>
  );
}

/* ---------- Mise en page ---------- */
export function EnTete({ titre, sousTitre, actions }: { titre: string; sousTitre?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl">{titre}</h1>
        {sousTitre && <p className="mt-1.5 text-[15px] text-doux">{sousTitre}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Carte({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-md bg-surface p-5 sm:p-6", className)}>{children}</div>;
}

export function TitreSection({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-doux">{children}</h2>
      {action}
    </div>
  );
}

type Ton = "neutre" | "vert" | "alerte" | "erreur";
const TONS: Record<Ton, string> = {
  neutre: "bg-surface text-doux ring-trait",
  vert: "bg-accent/10 text-accent ring-accent/20",
  alerte: "bg-alerte/10 text-alerte ring-alerte/25",
  erreur: "bg-erreur/10 text-erreur ring-erreur/25",
};
export function Badge({ ton = "neutre", children, className }: { ton?: Ton; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        TONS[ton],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Vide({ icone, titre, texte, action }: { icone?: ReactNode; titre: string; texte?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-trait px-6 py-14 text-center">
      {icone && <div className="mb-4 text-doux">{icone}</div>}
      <p className="font-semibold">{titre}</p>
      {texte && <p className="mt-1 max-w-sm text-sm text-doux">{texte}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Squelette({ className }: { className?: string }) {
  return <div className={cx("animate-squelette rounded-md bg-surface", className)} />;
}

export function Message({ ton = "erreur", children }: { ton?: "erreur" | "succes"; children: ReactNode }) {
  return (
    <p
      role={ton === "erreur" ? "alert" : "status"}
      className={cx(
        "rounded-md px-3.5 py-2.5 text-sm font-medium",
        ton === "erreur" ? "bg-erreur/10 text-erreur" : "bg-accent/10 text-accent",
      )}
    >
      {children}
    </p>
  );
}
