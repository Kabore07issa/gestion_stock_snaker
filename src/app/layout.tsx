import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { BOUTIQUE } from "@/config";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: BOUTIQUE.nom, template: `%s · ${BOUTIQUE.nom}` },
  description: `Gestion de la boutique ${BOUTIQUE.nom} — ventes, stock, clients et crédits.`,
  applicationName: BOUTIQUE.nom,
  appleWebApp: { capable: true, title: BOUTIQUE.nom, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1F16" },
  ],
};

// Applique le thème avant l'affichage pour éviter un flash.
const scriptTheme = `try{var t=localStorage.getItem('theme');if(t==='sombre'||(t!=='clair'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTheme }} />
      </head>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
