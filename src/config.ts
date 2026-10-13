/**
 * Configuration de la boutique.
 * Modifiez ces valeurs pour personnaliser l'application (nom, adresse, reçus…).
 */
export const BOUTIQUE = {
  nom: "Ma Boutique",
  slogan: "Sneakers & sport",
  ville: "Abidjan",
  adresse: "Cocody, Abidjan — Côte d'Ivoire",
  telephone: "+225 07 00 00 00 00",
  messageRecu: "Merci pour votre achat. Les articles ne sont ni repris ni échangés après 7 jours.",
  fuseauHoraire: "Africa/Abidjan",
  /** En dessous ou égal à ce seuil, un article est signalé « Stock faible ». */
  seuilStockFaible: 1,
};

export const OPERATEURS_MOBILE = ["Orange Money", "MTN MoMo", "Moov Money"] as const;
