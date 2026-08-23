import {
  FinancialSIGResult,
  FinancialBalanceSheetResult,
  InvestmentNPVIRRResult,
  StrategicMatrixAnalysis,
} from '../types';

/**
 * 1. Compute Soldes Intermédiaires de Gestion (SIG)
 */
export function calculateSIG(inputs: {
  caVentesMarchandises: number;
  coutAchatMarchandisesVendues: number;
  productionVendueBiensServices: number;
  consommationsProvenanceTiers: number;
  subventionsExploitation?: number;
  impotsTaxesVersementsAssimiles?: number;
  chargesPersonnel: number;
  dotationsAmortissementsProvisions: number;
  autresProduitsGestionCourante?: number;
  autresChargesGestionCourante?: number;
  produitsFinanciers?: number;
  chargesFinancieres?: number;
  produitsExceptionnels?: number;
  chargesExceptionnelles?: number;
  impotSurBenefices?: number;
}): FinancialSIGResult {
  const margeCommerciale = inputs.caVentesMarchandises - inputs.coutAchatMarchandisesVendues;
  const chiffreAffaires = inputs.caVentesMarchandises + inputs.productionVendueBiensServices;
  const productionExercice = inputs.productionVendueBiensServices;
  const valeurAjoutee = margeCommerciale + productionExercice - inputs.consommationsProvenanceTiers;

  const excedentBrutExploitation =
    valeurAjoutee +
    (inputs.subventionsExploitation || 0) -
    (inputs.impotsTaxesVersementsAssimiles || 0) -
    inputs.chargesPersonnel;

  const resultatExploitation =
    excedentBrutExploitation +
    (inputs.autresProduitsGestionCourante || 0) -
    (inputs.autresChargesGestionCourante || 0) -
    inputs.dotationsAmortissementsProvisions;

  const resultatCourantAvantImpot =
    resultatExploitation +
    (inputs.produitsFinanciers || 0) -
    (inputs.chargesFinancieres || 0);

  const resultatExceptionnel =
    (inputs.produitsExceptionnels || 0) - (inputs.chargesExceptionnelles || 0);

  const resultatNet =
    resultatCourantAvantImpot +
    resultatExceptionnel -
    (inputs.impotSurBenefices || 0);

  const capaciteAutofinancement =
    excedentBrutExploitation +
    (inputs.autresProduitsGestionCourante || 0) -
    (inputs.autresChargesGestionCourante || 0) +
    (inputs.produitsFinanciers || 0) -
    (inputs.chargesFinancieres || 0) +
    (inputs.produitsExceptionnels || 0) -
    (inputs.chargesExceptionnelles || 0) -
    (inputs.impotSurBenefices || 0);

  return {
    chiffreAffaires,
    margeCommerciale,
    valeurAjoutee,
    excedentBrutExploitation,
    resultatExploitation,
    resultatCourantAvantImpot,
    resultatNet,
    capaciteAutofinancement,
  };
}

/**
 * 2. Compute Bilan Fonctionnel (FRNG, BFR, Trésorerie Nette & Ratios)
 */
export function calculateBalanceSheet(inputs: {
  ressourcesStables: number; // Capitaux propres + Dettes financières à long terme
  emploisStables: number; // Actif immobilisé brut
  actifCirculantExploitation: number; // Stocks + Créances clients
  passifCirculantExploitation: number; // Dettes fournisseurs + Dettes fiscales/sociales
  actifCirculantHorsExploitation?: number;
  passifCirculantHorsExploitation?: number;
  dettesFinancieresTotales: number;
  capitauxPropres: number;
}): FinancialBalanceSheetResult {
  // FRNG = Ressources Stables - Emplois Stables
  const frng = inputs.ressourcesStables - inputs.emploisStables;

  // BFR = (Actif Circulant Exploitation + HE) - (Passif Circulant Exploitation + HE)
  const totalActifCirculant = inputs.actifCirculantExploitation + (inputs.actifCirculantHorsExploitation || 0);
  const totalPassifCirculant = inputs.passifCirculantExploitation + (inputs.passifCirculantHorsExploitation || 0);
  const bfr = totalActifCirculant - totalPassifCirculant;

  // Trésorerie Nette = FRNG - BFR
  const tresorerieNette = frng - bfr;

  // Ratios
  const ratioLiquiditeGenerale = totalPassifCirculant > 0 ? totalActifCirculant / totalPassifCirculant : 1;
  const ratioAutonomieFinanciere = inputs.dettesFinancieresTotales > 0 ? inputs.capitauxPropres / inputs.dettesFinancieresTotales : 1;

  const interpretation: string[] = [];

  if (frng > 0) {
    interpretation.push(`✓ FRNG Positif (+${frng.toLocaleString()} €) : Les capitaux permanents financent intégralement les immobilisations et dégagent un excédent de sécurité.`);
  } else {
    interpretation.push(`⚠️ FRNG Négatif (${frng.toLocaleString()} €) : Situation précaire, les immobilisations sont financées par des dettes à court terme.`);
  }

  if (tresorerieNette > 0) {
    interpretation.push(`✓ Trésorerie Nette Positive (+${tresorerieNette.toLocaleString()} €) : L'entreprise dispose de disponibilités monétaires immédiates pour faire face aux aléas.`);
  } else {
    interpretation.push(`⚠️ Trésorerie Nette Négative (${tresorerieNette.toLocaleString()} €) : Recours aux concours bancaires courants et découverts. Risque d'insolvabilité à court terme.`);
  }

  if (ratioAutonomieFinanciere >= 1) {
    interpretation.push(`✓ Ratio d'autonomie financière sain (${ratioAutonomieFinanciere.toFixed(2)}) >= 1.0 (Capitaux propres supérieurs aux dettes financières).`);
  } else {
    interpretation.push(`⚠️ Ratio d'autonomie faible (${ratioAutonomieFinanciere.toFixed(2)}) < 1.0 : Forte dépendance envers les créanciers bancaires.`);
  }

  return {
    frng,
    bfr,
    tresorerieNette,
    ratioLiquiditeGenerale,
    ratioAutonomieFinanciere,
    interpretation,
  };
}

/**
 * 3. Compute Investment Profitability: NPV (VAN) & IRR (TRI)
 */
export function calculateInvestmentNPVIRR(inputs: {
  investissementInitial: number; // I_0
  tauxActualisation: number; // e.g. 0.08 for 8%
  fluxTresorerieAnnuels: number[]; // [CF_1, CF_2, CF_3, CF_4, CF_5]
  valeurResiduelle?: number;
}): InvestmentNPVIRRResult {
  const I0 = inputs.investissementInitial;
  const r = inputs.tauxActualisation;
  const cfs = [...inputs.fluxTresorerieAnnuels];

  if (inputs.valeurResiduelle && inputs.valeurResiduelle > 0) {
    cfs[cfs.length - 1] += inputs.valeurResiduelle;
  }

  // VAN = Sum(CF_t / (1+r)^t) - I0
  let sommeFluxActualises = 0;
  const steps: string[] = [];

  cfs.forEach((cf, index) => {
    const t = index + 1;
    const fluxActualise = cf / Math.pow(1 + r, t);
    sommeFluxActualises += fluxActualise;
    steps.push(`Année ${t} : Flux brut = ${cf.toLocaleString()} € | Actualisé à ${(r * 100).toFixed(1)}% = ${fluxActualise.toFixed(2)} €`);
  });

  const van = sommeFluxActualises - I0;
  const indiceProfitabilite = I0 > 0 ? (sommeFluxActualises / I0) : 1;

  // Approximate IRR (TRI) via binary search
  let lowRate = -0.5;
  let highRate = 2.0;
  let triEstimated = r;

  for (let iter = 0; iter < 50; iter++) {
    const midRate = (lowRate + highRate) / 2;
    let npvMid = -I0;
    for (let t = 1; t <= cfs.length; t++) {
      npvMid += cfs[t - 1] / Math.pow(1 + midRate, t);
    }
    if (npvMid > 0) {
      lowRate = midRate;
    } else {
      highRate = midRate;
    }
    triEstimated = midRate;
  }

  // Payback period (Délai de récupération)
  let cumule = 0;
  let delaiRecuperationAnnees = cfs.length;
  for (let i = 0; i < cfs.length; i++) {
    cumule += cfs[i];
    if (cumule >= I0) {
      const precedent = cumule - cfs[i];
      const fraction = (I0 - precedent) / cfs[i];
      delaiRecuperationAnnees = i + fraction;
      break;
    }
  }

  return {
    van,
    triEstimated: triEstimated * 100,
    indiceProfitabilite,
    delaiRecuperationAnnees,
    isProfitable: van > 0,
    steps,
  };
}

/**
 * 4. Sample Strategic Matrices (SWOT, PESTEL, Porter)
 */
export const SAMPLE_STRATEGIC_MATRICES: StrategicMatrixAnalysis[] = [
  {
    companyOrProjectName: 'Entreprise Technologique / SaaS & IA',
    industry: 'Logiciels & Intelligence Artificielle',
    swot: {
      strengths: [
        'Propriété intellectuelle et algorithmes propriétaires performants',
        'Architecture cloud scalable et mode hors-ligne résilient',
        'Coût marginal de distribution quasi-nul',
      ],
      weaknesses: [
        'Frais d\'acquisition client (CAC) élevés sur les marchés concurrentiels',
        'Sensibilité à la rétention des talents en ingénierie et data science',
      ],
      opportunities: [
        'Adoption massive de l\'IA générative dans les universités et entreprises',
        'Partenariats avec des plateformes éducatives et institutions de formation',
      ],
      threats: [
        'Évolution rapide des modèles de fondation open-source',
        'Réglementations strictes sur la confidentialité des données (RGPD / AI Act)',
      ],
    },
    pestel: {
      political: ['Souveraineté numérique nationale', 'Subventions à l\'innovation et à la recherche R&D'],
      economic: ['Taux d\'intérêt influençant les levées de fonds', 'Pression sur les budgets IT'],
      social: ['Démocratisation du télétravail et de l\'auto-apprentissage continu'],
      technological: ['Essor des NPU/GPU embarqués et de l\'inférence locale'],
      environmental: ['Efficacité énergétique des centres de données et empreinte carbone'],
      legal: ['Législation sur le droit d\'auteur, propriété intellectuelle et IA Act européen'],
    },
    porterFiveForces: {
      threatNewEntrants: { level: 'Élevé', details: 'Barrières à l\'entrée faibles pour les applications légères, mais élevées pour les modèles d\'infrastructure.' },
      bargainingPowerSuppliers: { level: 'Modéré', details: 'Fournisseurs de cloud (AWS/GCP) et fabricants de puces disposant d\'un pouvoir de négociation sensible.' },
      bargainingPowerBuyers: { level: 'Modéré', details: 'Facilité de comparaison des offres et volatilité des abonnements mensuels.' },
      threatSubstitutes: { level: 'Élevé', details: 'Outils généralistes et solutions gratuites fournies par les géants du secteur.' },
      competitiveRivalry: { level: 'Élevé', details: 'Course permanente à la mise à jour des fonctionnalités et à l\'expérience utilisateur.' },
    },
  },
];
