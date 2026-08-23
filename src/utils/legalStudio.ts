import { LegalSyllogismCase, CourtRulingAnalysis } from '../types';

export const STANDARD_LEGAL_CASES: LegalSyllogismCase[] = [
  {
    id: 'legal_responsabilite_civile',
    title: 'Responsabilité Civile Extracontractuelle (Article 1240 C. Civ.)',
    subjectCategory: 'Droit Civil & Obligations',
    factsSummary: 'Lors de travaux de rénovation sur son balcon, Monsieur A laisse tomber un pot de fleurs qui s\'écrase sur le pare-brise de la voiture en stationnement de Madame B, causant des bris de verre et des dégâts matériels chiffrés à 1 500 €.',
    qualifiedFacts: [
      'Monsieur A a commis une négligence matérielle (chute d\'un objet depuis sa propriété privée).',
      'Madame B subit une dégradation matérielle certaine et actuelle sur son véhicule.',
      'Lien de causalité direct et exclusif entre la chute de l\'objet et la détérioration du pare-brise.',
    ],
    legalQuestion: 'Une personne ayant causé un préjudice matériel à autrui par négligence est-elle tenue d\'en réparer intégralement les conséquences pécuniaires ?',
    majorLegalRule: [
      'Article 1240 du Code civil : "Tout fait quelconque de l\'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé, à le réparer."',
      'Article 1241 du Code civil : "Chacun est responsable du dommage qu\'il a causé non seulement par son fait, mais encore par sa négligence ou par son imprudence."',
      'Principe de la réparation intégrale du préjudice : la victime doit être replacée dans l\'état exact où elle se serait trouvée sans la survenance du fait dommageable.',
    ],
    jurisprudenceReferences: [
      'Cass. Civ. 2e, 28 oct. 1954 : La faute s\'apprécie in abstracto par rapport au comportement d\'un individu normalement prudent et diligent.',
      'Cass. Civ. 2e, 19 juin 2003 : Nécessité de la preuve cumulative des trois éléments (faute, dommage certain, lien de causalité).',
    ],
    minorApplication: [
      '1. Faute avérée : Le défaut de sécurisation des objets lors des travaux constitue une imprudence caractérisée (art. 1241 C. civ.).',
      '2. Dommage direct et certain : Les factures de remplacement du pare-brise (1 500 €) matérialisent un dommage patrimonial réel.',
      '3. Causalité évidente : Sans la chute du pot, le bris de glace ne se serait pas produit (théorie de l\'équivalence des conditions).',
    ],
    conclusion: 'Monsieur A engage pleinement sa responsabilité civile extracontractuelle et doit verser à Madame B la somme de 1 500 € à titre de dommages et intérêts en réparation du préjudice matériel.',
  },
  {
    id: 'legal_vice_du_consentement',
    title: 'Nullité du Contrat de Vente pour Dol (Article 1137 C. Civ.)',
    subjectCategory: 'Droit Civil & Obligations',
    factsSummary: 'Monsieur X achète un véhicule d\'occasion affichant 60 000 km au compteur. Deux mois après la vente, une expertise technique révèle que le vendeur professionnel avait délibérément trafiqué le compteur qui totalisait en réalité 210 000 km.',
    qualifiedFacts: [
      'Conclusion d\'un contrat synallagmatique de vente entre un professionnel et un acquéreur non professionnel.',
      'Manoeuvre frauduleuse intentionnelle (tromperie sur le kilométrage réel du bien vendu).',
      'Caractère déterminant de la fausse information lors de la décision d\'achat.',
    ],
    legalQuestion: 'La dissimulation intentionnelle et la modification des caractéristiques substantielles d\'un bien par le vendeur justifient-elles l\'annulation du contrat et l\'octroi de dommages et intérêts ?',
    majorLegalRule: [
      'Article 1137 du Code civil : "Le dol est le fait pour un contractant d\'obtenir le consentement de l\'autre par des manœuvres ou des mensonges. Constitue également un dol la dissimulation intentionnelle par l\'un des contractants d\'une information dont il sait le caractère déterminant pour l\'autre partie."',
      'Article 1131 du Code civil : "Les vices du consentement sont une cause de nullité relative du contrat."',
      'Article 1178 du Code civil : La nullité emporte l\'anéantissement rétroactif du contrat et la remise des parties en l\'état antérieur.',
    ],
    jurisprudenceReferences: [
      'Cass. Com., 27 févr. 1996 : La réticence dolosive et la tromperie sur les qualités substantielles entraînent la nullité absolue ou relative et ouvrent droit à réparation.',
    ],
    minorApplication: [
      '1. Manœuvres frauduleuses : La modification physique du compteur kilométrique caractérise l\'élément matériel et intentionnel du dol.',
      '2. Erreur provoquée et déterminante : L\'acheteur n\'aurait jamais acquis le véhicule à ce prix s\'il avait connu son usure réelle de 210 000 km.',
      '3. Cumul d\'actions : La victime peut solliciter conjointement la nullité relative du contrat et des dommages et intérêts pour préjudice moral et financier.',
    ],
    conclusion: 'Le tribunal prononcera la nullité du contrat de vente. Monsieur X restituera le véhicule et le vendeur devra rembourser l\'intégralité du prix de vente majoré des dommages et intérêts pour manquement à la bonne foi.',
  },
  {
    id: 'legal_legitime_defense',
    title: 'Légitime Défense en Droit Pénal (Article 122-5 C. Pénal)',
    subjectCategory: 'Droit Pénal',
    factsSummary: 'Une personne agressée physiquement de nuit dans une ruelle sombre par un individu armé d\'une barre de fer riposte immédiatement en portant un coup de poing qui désarme son agresseur et le fait chuter, lui causant une fracture du poignet.',
    qualifiedFacts: [
      'Attaque nocturne violente, injustifiée et actuelle contre l\'intégrité physique de la personne.',
      'Riposte immédiate et concomitante à l\'agression.',
      'Moyen de défense proportionné à la gravité de la menace (usage des mains nues face à une arme contondante).',
    ],
    legalQuestion: 'L\'auteur d\'un acte de violence commis pour repousser une atteinte injustifiée contre sa propre personne bénéficie-t-il d\'une cause d\'irresponsabilité pénale ?',
    majorLegalRule: [
      'Article 122-5 alinéa 1 du Code pénal : "N\'est pas pénalement responsable la personne qui, devant une atteinte injustifiée envers elle-même ou autrui, accomplit, dans le même temps, un acte commandé par la nécessité de la légitime défense d\'elle-même ou d\'autrui, sauf s\'il y a disproportion entre les moyens de défense employés et la gravité de l\'atteinte."',
      'Critères cumulatifs de la légitime défense : 1. Attaque actuelle ou imminente, injuste et réelle ; 2. Riposte nécessaire, simultanée et strictement proportionnée.',
    ],
    jurisprudenceReferences: [
      'Cass. Crim., 21 févr. 1996 : La proportionnalité s\'apprécie au regard des circonstances précises de l\'agression et de la menace perçue.',
    ],
    minorApplication: [
      '1. Attaque illégitime et actuelle : L\'usage d\'une barre de fer créait un danger imminent et vital.',
      '2. Nécessité de l\'acte : Aucune autre issue de fuite sécurisée n\'était possible dans l\'instant.',
      '3. Proportionnalité : Frapper à mains nues pour désarmer un agresseur armé ne présente aucune disproportion manifeste.',
    ],
    conclusion: 'L\'agression injustifiée et la riposte proportionnée satisfont pleinement les exigences de l\'article 122-5 du Code pénal. Le défenseur est déclaré pénalement irresponsable et aucune poursuite ni condamnation ne sera retenue.',
  },
];

/**
 * Generate a standard Ruling Analysis (Fiche d'arrêt)
 */
export function generateFicheArret(data: CourtRulingAnalysis): string {
  return `### ⚖️ FICHE D'ARRÊT MÉTHODOLOGIQUE

**1. Juridiction & Date :** ${data.court} — ${data.date} (${data.jurisdiction})

**2. Les Faits Qualifiés Juridiquement :**
${data.facts}

**3. La Procédure :**
${data.proceduralHistory}

**4. Les Prétentions des Parties :**
- **Demandeur / Appelant :** ${data.claimsOfParties.appellant}
- **Défendeur / Intimé :** ${data.claimsOfParties.respondent}

**5. Le Problème de Droit :**
> *${data.legalProblem}*

**6. La Solution de la Cour (Dispositif & Motivation) :**
${data.courtSolution}

**7. Portée Doctrinale & Jurisprudentielle :**
${data.doctrineScope}`;
}
