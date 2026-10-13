"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Users, Boxes, HandCoins, Settings, Plus } from "lucide-react";
import { Logo } from "./logo";
import { cx } from "./ui";

const LIENS = [
  { href: "/", label: "Accueil", Icone: Home },
  { href: "/ventes", label: "Ventes", Icone: ShoppingBag },
  { href: "/clients", label: "Clients", Icone: Users },
  { href: "/stock", label: "Stock", Icone: Boxes },
  { href: "/credits", label: "Crédits", Icone: HandCoins },
];

function actif(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Pastille({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span
      className={cx(
        "chiffres inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-erreur px-1 text-[11px] font-bold leading-none text-white",
        className,
      )}
      aria-label={`${n} rappel${n > 1 ? "s" : ""}`}
    >
      {n}
    </span>
  );
}

export function Navigation({ rappels, identifiant }: { rappels: number; identifiant: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Barre latérale — ordinateur / tablette paysage */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-trait bg-fond px-4 py-7 lg:flex">
        <Link href="/" className="px-2">
          <Logo taille="sm" />
        </Link>

        <Link
          href="/ventes/nouvelle"
          className="mt-9 flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-[15px] font-semibold text-accent-texte transition-colors duration-150 hover:bg-accent-hover"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
          Nouvelle vente
        </Link>

        <nav className="mt-8 flex flex-col gap-0.5">
          {LIENS.map(({ href, label, Icone }) => {
            const on = actif(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-semibold transition-colors duration-150",
                  on ? "bg-accent/[0.08] text-accent" : "text-doux hover:bg-surface hover:text-encre",
                )}
              >
                <Icone className="h-[19px] w-[19px]" strokeWidth={1.6} />
                {label}
                {href === "/credits" && <Pastille n={rappels} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-trait pt-4">
          <Link
            href="/reglages"
            className={cx(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-semibold transition-colors duration-150",
              actif(pathname, "/reglages") ? "bg-accent/[0.08] text-accent" : "text-doux hover:bg-surface hover:text-encre",
            )}
          >
            <Settings className="h-[19px] w-[19px]" strokeWidth={1.6} />
            Réglages
          </Link>
          <p className="mt-3 truncate px-3 text-xs text-doux">Connecté : {identifiant}</p>
        </div>
      </aside>

      {/* En-tête — mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-trait bg-fond/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="Accueil">
          <Logo taille="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/ventes/nouvelle"
            className="flex h-11 items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-semibold text-accent-texte"
          >
            <Plus className="h-4 w-4" strokeWidth={2} /> Vendre
          </Link>
          <Link
            href="/reglages"
            aria-label="Réglages"
            className={cx(
              "flex h-11 w-11 items-center justify-center rounded-md",
              actif(pathname, "/reglages") ? "text-accent" : "text-doux",
            )}
          >
            <Settings className="h-5 w-5" strokeWidth={1.6} />
          </Link>
        </div>
      </header>

      {/* Barre d'onglets — mobile */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-trait bg-fond/95 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {LIENS.map(({ href, label, Icone }) => {
            const on = actif(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cx(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-150",
                    on ? "text-accent" : "text-doux",
                  )}
                >
                  <span className={cx("absolute top-0 h-0.5 w-8 rounded-full transition-colors duration-200", on ? "bg-accent" : "bg-transparent")} />
                  <span className="relative">
                    <Icone className="h-[22px] w-[22px]" strokeWidth={on ? 1.9 : 1.5} />
                    {href === "/credits" && <Pastille n={rappels} className="absolute -right-3 -top-1.5" />}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

