/** Normalise un texte pour la recherche (minuscules, sans accents ni espaces superflus). */
export function normaliser(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Tous les mots de la requête doivent apparaître dans l'un des champs. */
export function correspond(requete: string, ...champs: (string | null | undefined)[]) {
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  if (!mots.length) return true;
  const texte = normaliser(champs.filter(Boolean).join(" "));
  const chiffres = texte.replace(/\s/g, "");
  return mots.every((m) => texte.includes(m) || chiffres.includes(m.replace(/\s/g, "")));
}
