# Ma Boutique — gestion de boutique de sneakers

Application web simple pour gérer une boutique de chaussures de sport à Abidjan :
**ventes, clients, stock, crédits et rappels**, avec reçus imprimables, exports Excel
et sauvegarde de la base. Installable sur téléphone (PWA), utilisable sur ordinateur et tablette.

- Next.js 15 (App Router) · TypeScript · Tailwind CSS
- Base SQLite via Prisma : **un seul fichier** (`data/boutique.db`)
- Un seul compte (identifiant + mot de passe hashé bcrypt), session signée dans un cookie `httpOnly`
- Montants en FCFA (`45 000 FCFA`), dates au format JJ/MM/AAAA, fuseau Africa/Abidjan

---

## Démarrage le plus simple (Windows)

1. Installez **Node.js** (version « LTS ») depuis https://nodejs.org — suivant, suivant, terminer.
2. Téléchargez le projet : sur GitHub, bouton vert **Code → Download ZIP**, puis décompressez le dossier.
3. Double-cliquez sur **`Lancer la boutique.bat`**.
   La première fois, l'installation prend quelques minutes. Le navigateur s'ouvre ensuite sur
   http://localhost:3000 où vous créez votre compte.
4. Gardez la fenêtre noire ouverte pendant que vous utilisez l'application. Pour arrêter : fermez-la.

Pour charger les données de démonstration : ouvrez un terminal dans le dossier et tapez `npm run db:seed`.

## 1. Installation (manuelle)

Prérequis : **Node.js 20 ou plus récent** (https://nodejs.org).

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier de configuration
cp .env.example .env
```

Ouvrez `.env` et remplacez `AUTH_SECRET` par une longue chaîne aléatoire. Pour en générer une :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
# 3. Créer la base de données (fichier data/boutique.db)
npm run db:push

# 4. (Facultatif) Charger les données de démonstration
npm run db:seed
```

> ⚠️ `npm run db:seed` **efface** les articles, clients, ventes et crédits existants
> (le compte est conservé). À n'utiliser que pour essayer l'application.

## 2. Lancement

**En développement** (rechargement automatique) :

```bash
npm run dev
```

**En production** (plus rapide, recommandé pour la boutique) :

```bash
npm run build
npm start
```

Ouvrez ensuite http://localhost:3000.

Pour l'utiliser depuis le téléphone sur le même Wi-Fi, ouvrez `http://<adresse-IP-de-l-ordinateur>:3000`.
En production sans HTTPS (réseau local), ajoutez `COOKIE_NON_SECURISE=1` avant `npm start`,
sinon le navigateur refusera le cookie de session :

```bash
COOKIE_NON_SECURISE=1 npm start
```

Sur un serveur en ligne, utilisez toujours HTTPS (et n'ajoutez pas cette variable).

## 3. Création du compte

Au **premier lancement**, l'écran de connexion propose directement de **créer le compte** du gérant
(identifiant + mot de passe de 8 caractères minimum). Il n'existe qu'un seul compte.

Vous pouvez aussi le créer — ou **réinitialiser un mot de passe oublié** — en ligne de commande :

```bash
npm run compte -- gerant MonMotDePasseSolide
```

Le mot de passe se change ensuite dans **Réglages**.

## 4. Sauvegarde

- **Réglages → Télécharger une sauvegarde** : télécharge une copie complète et cohérente de la base
  (`sauvegarde-boutique-AAAA-MM-JJ.db`). Faites-le au moins une fois par semaine et gardez le fichier
  sur une clé USB ou dans le cloud.
- Les **photos** des articles sont dans le dossier `data/uploads/` : copiez-le aussi de temps en temps.
- **Restaurer** : arrêtez l'application, remplacez `data/boutique.db` par le fichier de sauvegarde
  (renommé `boutique.db`), puis relancez.

Exports Excel (.xlsx) : boutons « Excel » sur les pages Ventes (avec les filtres en cours), Stock et
Crédits, ou depuis Réglages.

## 5. Utilisation

| Module | Ce qu'on y fait |
| --- | --- |
| **Accueil** | Ventes du jour et du mois, encaissements par mode, crédits à récupérer, rappels du jour, stock faible, graphique 30 jours |
| **Ventes** | Nouvelle vente en 3 gestes (articles → client → paiement), reçu ticket 80 mm, historique filtrable, annulation (remet le stock) |
| **Clients** | Fiche, historique des achats, reste à payer, appel direct |
| **Stock** | Articles avec photo, arrivages, ajustements avec motif, badges « Stock faible » (≤ 1) / « Rupture » (0) |
| **Crédits** | Statut automatique (En cours / En retard / Soldé), versements partiels, date de rappel, bouton « Relancer » |

Paiements gérés : **Espèces** (calcul de la monnaie), **Wave** (n° de transaction),
**Mobile Money** (Orange Money, MTN MoMo, Moov Money + n° de transaction) et **Crédit**
(client obligatoire, avance facultative, date de rappel obligatoire). Aucune intégration
de paiement automatique : les numéros de transaction sont saisis à la main.

Le jour de la date de rappel (ou après), le client apparaît dans **Rappels du jour** et une
pastille rouge s'affiche sur l'onglet **Crédits**.

### Installer sur le téléphone

Ouvrez l'application dans Chrome (Android) ou Safari (iPhone), puis
« Ajouter à l'écran d'accueil ». L'installation complète en PWA nécessite HTTPS
(ou `localhost`).

## 6. Personnalisation

- **Nom, adresse, téléphone, message du reçu, seuil de stock faible** : `src/config.ts`
- **Logo** : les tracés sont dans `scripts/logo.mjs` (et `src/components/logo.tsx`).
  Après avoir changé le nom, régénérez les fichiers du logo et les icônes :

  ```bash
  node scripts/logo.mjs "Nom de ma boutique"
  ```

  Déclinaisons produites : `public/logo.svg` (vert sur blanc), `public/logo-blanc.svg`
  (blanc sur vert), `public/icons/*` (icônes PWA), `src/app/icon.svg` (favicon),
  `src/app/apple-icon.png`.
- **Couleurs** : variables CSS dans `src/app/globals.css` (thème clair et sombre).

## 7. Structure

```
prisma/schema.prisma      Schéma de la base
prisma/seed.ts            Données de démonstration
scripts/creer-compte.ts   Création / réinitialisation du compte
scripts/logo.mjs          Génération du logo et des icônes
src/config.ts             Paramètres de la boutique
src/app/connexion         Écran de connexion / création du compte
src/app/(app)/…           Pages : accueil, ventes, clients, stock, crédits, réglages
src/app/api/…             Exports Excel, sauvegarde, photos
src/lib/actions/…         Actions serveur (ventes, stock, clients, crédits, auth)
src/components/…          Interface (caisse, reçu, graphique, formulaires…)
data/                     Base SQLite + photos (non versionné)
```

## Commandes utiles

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Lancer en développement |
| `npm run build` puis `npm start` | Lancer en production |
| `npm run db:push` | Créer / mettre à jour la base |
| `npm run db:seed` | Charger les données de démonstration |
| `npm run compte -- <identifiant> <mot-de-passe>` | Créer le compte ou changer le mot de passe |
| `npm run typecheck` | Vérifier le typage TypeScript |
