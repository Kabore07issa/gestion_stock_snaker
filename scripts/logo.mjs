// Génère les déclinaisons du logo (SVG + PNG pour la PWA).
// Usage : node scripts/logo.mjs   (nécessite le paquet "sharp", installé avec Next.js)
import { writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const VERT = "#0A7A4F";
const NOM = process.argv[2] ?? "Ma Boutique";

// Silhouette de sneaker en trait fin — repère 64 × 40
export const TRACES = [
  "M7.5 32.5H56.5Q61 32.5 61 28.5Q61 24.6 55.5 23L45 20Q39.5 18.4 35 14.6L28 8.8Q25.6 6.9 23.4 9.1L20.6 12Q17.4 15.3 13 13.6Q8.4 11.9 6.6 16.4Q5 20.5 5 25.5V30Q5 32.5 7.5 32.5Z",
  "M5.2 27.5H60.6",
  "M27.6 12.6l-2.2 3M31.4 15.8l-2.2 3M35.4 18.6l-2 3",
  "M12.5 20.5Q21 23.2 30.6 22.7",
];

const traits = (couleur, ep = 1.6) =>
  `<g fill="none" stroke="${couleur}" stroke-width="${ep}" stroke-linecap="round" stroke-linejoin="round">${TRACES.map((d) => `<path d="${d}"/>`).join("")}</g>`;

const texte = (couleur) =>
  `<text x="71" y="27.5" font-family="Manrope, Inter, Helvetica, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="-0.4" fill="${couleur}">${NOM}</text>`;

const largeur = Math.round(77 + NOM.length * 10.2);

const logoCouleur = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} 40" width="${largeur * 4}" height="160"><rect width="100%" height="100%" fill="#fff"/>${traits(VERT)}${texte("#0E2A1E")}</svg>`;
const logoBlanc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} 40" width="${largeur * 4}" height="160"><rect width="100%" height="100%" fill="${VERT}"/>${traits("#fff")}${texte("#fff")}</svg>`;

// Icône carrée : sneaker blanche sur fond vert (zone de sécurité « maskable » respectée)
const icone = (arrondi) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512"><rect width="64" height="64" rx="${arrondi}" fill="${VERT}"/><g transform="translate(9.6 18) scale(0.7)">${traits("#fff", 2.3)}</g></svg>`;
// Favicon : sneaker verte sur fond blanc
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#fff"/><g transform="translate(2 8) scale(0.94)">${traits(VERT, 3.4)}</g></svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/logo.svg", logoCouleur);
writeFileSync("public/logo-blanc.svg", logoBlanc);
writeFileSync("public/icons/icon.svg", icone(14));
writeFileSync("public/icons/icon-maskable.svg", icone(0));
writeFileSync("src/app/icon.svg", favicon);

const png = (svg, taille, sortie) => sharp(Buffer.from(svg)).resize(taille, taille).png().toFile(sortie);
await Promise.all([
  png(icone(14), 192, "public/icons/icon-192.png"),
  png(icone(14), 512, "public/icons/icon-512.png"),
  png(icone(0), 512, "public/icons/icon-maskable-512.png"),
  png(icone(0), 180, "src/app/apple-icon.png"),
]);
await sharp(Buffer.from(logoCouleur)).png().toFile("public/logo.png");
console.log("Logos générés.");
