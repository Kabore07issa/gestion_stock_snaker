// Prépare le premier lancement : crée le fichier .env (avec une clé secrète
// aléatoire) et le dossier data/ s'ils n'existent pas encore.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (!existsSync(".env")) {
  const modele = readFileSync(".env.example", "utf8");
  writeFileSync(".env", modele.replace("remplacez-moi-par-une-longue-chaine-aleatoire", randomBytes(32).toString("hex")));
  console.log("Fichier .env créé.");
}
mkdirSync("data/uploads", { recursive: true });
