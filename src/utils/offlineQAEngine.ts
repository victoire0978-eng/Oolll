import { CourseChunk, LocalCourse, SearchResultMatch, DakisMemory } from '../types';
import { expandAndNormalizeQuery, searchOfflineChunks } from './offlineSearchEngine';
import { solveOfflineMath, MathCalculationResult } from './offlineMathEngine';

export interface OfflineQAResponse {
  answerText: string;
  intent: 'question' | 'math_calc' | 'definition' | 'explanation' | 'comparison' | 'general' | 'secret';
  subjectTitle?: string;
  keyPoints?: string[];
  formulas?: string[];
  sourceMatches: SearchResultMatch[];
  mathResult: MathCalculationResult | null;
  suggestedFollowUps?: string[];
  confidence?: number; // 0.0 to 1.0
  badge?: 'VERT' | 'ORANGE' | 'ROUGE';
  sourceExcerpt?: string;
  sourcePage?: number;
  sourceCourseId?: string;
  courseId?: string;
  imageUrl?: string;
  canEnrichOnline?: boolean;
}

interface AcademicTopic {
  id: string;
  keywords: string[];
  faculty: string;
  title: string;
  definition: string;
  principles: string[];
  formulas?: string[];
  practicalExample?: string;
  detailedExplanation: string;
}

// Comprehensive Offline Academic Knowledge Base
const ACADEMIC_KNOWLEDGE_BASE: AcademicTopic[] = [
  {
    id: 'rdm_fondements',
    keywords: ['rdm', 'resistance des materiaux', 'materiaux', 'navier bernoulli', 'fibre neutre', 'ligne moyenne', 'poutre'],
    faculty: 'Polytechnique',
    title: 'Résistance des Matériaux (RDM) & Théorie des Poutres',
    definition: 'La Résistance des Matériaux (RDM) est la discipline de la mécanique qui étudie le comportement, le dimensionnement, la rigidité et la stabilité des éléments structuraux (poutres, poteaux, plaques) soumis à des sollicitations extérieures (traction, compression, flexion, cisaillement, torsion).',
    principles: [
      '**Hypothèse de Navier-Bernoulli** : Les sections droites planes avant déformation restent planes et perpendiculaires à la ligne moyenne déformée.',
      '**Hypothèse de Barré de Saint-Venant** : Les résultats de la théorie des poutres sont valables à une distance suffisante des points d\'application des charges concentrées.',
      '**Loi de Hooke uniaxiale** : Dans le domaine élastique linéaire, la contrainte normale est proportionnelle à la déformation : `σ = E · ε`.',
      '**Principe de superposition** : Dans le domaine élastique et pour de petits déplacements, les effets de plusieurs forces s\'additionnent algébriquement.'
    ],
    formulas: [
      'σ = E · ε (Loi de Hooke)',
      'σ(y) = (M_f · y) / I_z (Contrainte normale en flexion)',
      'M_max = (q · L²) / 8 (Moment fléchissant maximal pour poutre bi-appuyée sous charge uniforme q)',
      'M_max = (F · L) / 4 (Moment maximal sous force ponctuelle centrée F)',
      'I_z = (b · h³) / 12 (Moment quadratique section rectangulaire)',
      'f_max = (5 · q · L⁴) / (384 · E · I_z) (Flèche maximale poutre bi-appuyée)'
    ],
    practicalExample: 'Pour une poutre en acier de 6 m sous une charge de 12 kN/m : le moment maximal est M = (12 × 36) / 8 = 54 kN·m. On dimensionne la section pour que la contrainte σ = M / W_z reste inférieure à la limite d\'élasticité admissible.',
    detailedExplanation: 'En ingénierie de structure, la RDM permet de vérifier deux conditions fondamentales : la **condition de résistance** (les contraintes ne dépassent pas la résistance admissible du matériau) et la **condition de rigidité** (les déformations et flèches restent admissibles pour l\'usage de l\'ouvrage).'
  },
  {
    id: 'beton_arme_eurocode',
    keywords: ['beton', 'beton arme', 'acier', 'armature', 'elu', 'els', 'eurocode 2', 'fissuration', 'enrobage'],
    faculty: 'Polytechnique / Génie Civil',
    title: 'Traité de Béton Armé & Dimensionnement Eurocode 2',
    definition: 'Le béton armé est un matériau composite associant le béton (qui résiste excellemment à la compression mais très faiblement à la traction) et l\'acier d\'armature (qui présente une très haute résistance à la traction et une excellente ductilité).',
    principles: [
      '**Adhérence acier-béton** : L\'adhérence parfaite permet la transmission des efforts sans glissement relatif grâce aux nervures des barres haute adhérence (HA).',
      '**Coefficient de dilatation thermique identique** : L\'acier et le béton ont le même coefficient de dilatation (~10⁻⁵ K⁻¹), évitant les contraintes thermiques destructrices.',
      '**État Limite Ultime (ELU)** : Dimensionnement pour garantir la sécurité absolue contre la rupture, la perte d\'équilibre statique et l\'effondrement (`1.35 G + 1.5 Q`).',
      '**État Limite de Service (ELS)** : Dimensionnement pour assurer le confort des usagers, la durabilité, la limitation des flèches et la maîtrise de l\'ouverture des fissures (`G + Q`).'
    ],
    formulas: [
      'f_cd = f_ck / γ_c (Résistance de calcul du béton, γ_c = 1.5)',
      'f_yd = f_yk / γ_s (Résistance de calcul de l\'acier, γ_s = 1.15)',
      'μ_u = M_u / (b · d² · f_cd) (Moment ultime réduit)',
      'A_s = M_u / (z · f_yd) (Section d\'acier tendu requise)',
      'z = d · (1 - 0.4 · α_u) avec α_u = 1.25 · (1 - √(1 - 2μ_u))',
      'A_s,min = 0.26 · (f_ctm / f_yk) · b_t · d (Section minimale de non-fragilité)'
    ],
    practicalExample: 'Dans une poutre de plancher soumise à un moment M_u = 120 kN·m, on calcule le moment réduit μ_u. S\'il est inférieur à 0.372 (pivot B), la section n\'a pas besoin d\'aciers comprimés et on détermine directement la section des aciers tendus A_s.',
    detailedExplanation: 'L\'enrobage minimal des armatures (souvent 3 à 5 cm selon la classe d\'exposition environnementale) protège l\'acier contre la corrosion grâce à la basicité naturelle du béton (passivation alcaline par la chaux Ca(OH)₂).'
  },
  {
    id: 'electrotechnique_ohm_puissances',
    keywords: ['loi d\'ohm', 'ohm', 'electricite', 'electrotechnique', 'tension', 'courant', 'puissance', 'kirchhoff', 'impedance', 'triphase', 'monophase'],
    faculty: 'Polytechnique / Électrotechnique',
    title: 'Électrotechnique, Lois Fondamentales des Circuits & Puissances',
    definition: 'L\'électrotechnique traite des applications pratiques de l\'électricité, de la production, du transport, de la conversion et de l\'utilisation de l\'énergie électrique en régimes continu, alternatif monophasé et triphasé.',
    principles: [
      '**Loi d\'Ohm** : La différence de potentiel `U` aux bornes d\'un conducteur ohmique est proportionnelle à l\'intensité `I` du courant qui le traverse : `U = R · I`.',
      '**Loi des nœuds (1ère loi de Kirchhoff)** : La somme algébrique des courants entrant dans un nœud est égale à la somme des courants qui en sortent (`∑ I_in = ∑ I_out`).',
      '**Loi des mailles (2ème loi de Kirchhoff)** : La somme algébrique des tensions le long d\'une maille fermée orientée est nulle (`∑ U_k = 0`).',
      '**Triangle des puissances** : Puissance active P (watts, W), puissance réactive Q (volt-ampères réactifs, VAR), puissance apparente S (volt-ampères, VA) liées par `S² = P² + Q²`.'
    ],
    formulas: [
      'U = R · I (Loi d\'Ohm continu)',
      'P = U · I · cos(φ) (Puissance active monophasée)',
      'Q = U · I · sin(φ) (Puissance réactive monophasée)',
      'S = U · I = √(P² + Q²) (Puissance apparente monophasée)',
      'P_tri = √3 · U · I · cos(φ) (Puissance active triphasée avec U tension composée)',
      'Z = √(R² + (Lω - 1/(Cω))²) (Impédance circuit RLC série)'
    ],
    practicalExample: 'Un moteur monophasé alimenté en 230 V absorbe 10 A avec un facteur de puissance cos(φ) = 0.85. Puissance active consommée : P = 230 × 10 × 0.85 = 1 955 W (1.955 kW). Puissance apparente : S = 2 300 VA.',
    detailedExplanation: 'L\'amélioration du facteur de puissance cos(φ) via des batteries de condensateurs permet de réduire l\'intensité totale appelée sur le réseau, réduisant les pertes par effet Joule en ligne sans modifier la puissance mécanique utile fournie.'
  },
  {
    id: 'droit_obligations_contrat',
    keywords: ['obligation', 'contrat', 'droit civil', 'responsabilite', 'validite', 'consentement', 'capacite', 'objet', 'cause', 'nullite', 'delictuelle', 'contractuelle', 'upl'],
    faculty: 'Droit (BAC1 UPL)',
    title: 'Théorie Générale des Obligations & Droit des Contrats',
    definition: 'En droit civil, une obligation est un lien de droit (vinculum juris) à caractère patrimonial unissant deux ou plusieurs personnes, en vertu duquel le créancier a le pouvoir d\'exiger du débiteur une prestation (donner, faire ou ne pas faire).',
    principles: [
      '**Les 4 conditions de validité d\'un contrat (Art. 1108 anc. / Réforme)** :\n  1. **Le consentement libre et éclairé** (exempt de vices : erreur, dol, violence).\n  2. **La capacité juridique** de contracter (personne majeure non frappée d\'incapacité légale).\n  3. **Un objet certain et licite** qui forme la matière de l\'engagement.\n  4. **Une cause licite** dans l\'obligation (motif conforme à l\'ordre public et aux bonnes mœurs).',
      '**Force obligatoire du contrat** : Les conventions légalement formées tiennent lieu de loi à ceux qui les ont faites (pacta sunt servanda).',
      '**Sanction des vices de formation** : La nullité relative (protection d\'un intérêt privé, ex: vice du consentement) vs La nullité absolue (protection de l\'intérêt général ou de l\'ordre public).',
      '**Responsabilité civile (Délictuelle vs Contractuelle)** : Exige la réunion de trois éléments cumulatifs : une **faute**, un **dommage ou préjudice** (certain, direct et légitime), et un **lien de causalité direct**.'
    ],
    formulas: [
      'Responsabilité civile = Faute + Préjudice (matériel/moral/corporel) + Lien de Causalité',
      'Classification des obligations : De résultat (obligation stricte) vs De moyens (obligation de prudence et diligence)'
    ],
    practicalExample: 'Si un vendeur dissimule délibérément un vice grave d\'un véhicule pour forcer la vente, il commet un dol. L\'acheteur peut intenter une action en nullité relative du contrat pour vice du consentement et réclamer des dommages et intérêts.',
    detailedExplanation: 'L\'obligation civile se distingue de l\'obligation naturelle ou morale car elle est assortie d\'une contrainte étatique (sanction judiciaire et voies d\'exécution forcée par voie d\'huissier ou de saisie).'
  },
  {
    id: 'droit_constitutionnel_etat',
    keywords: ['droit constitutionnel', 'etat', 'constitution', 'pouvoir', 'separation des pouvoirs', 'parlementaire', 'presidentiel', 'kelsen', 'normes'],
    faculty: 'Droit / Sciences Politiques',
    title: 'Droit Constitutionnel, Théorie de l\'État & Séparation des Pouvoirs',
    definition: 'Le Droit Constitutionnel est la branche fondamentale du droit public qui organise les institutions politiques de l\'État, encadre l\'exercice de la souveraineté nationale et garantit les droits fondamentaux des citoyens.',
    principles: [
      '**Les 3 éléments constitutifs de l\'État** :\n  1. Un **territoire délimité** par des frontières.\n  2. Une **population permanente** (corps social).\n  3. Un **pouvoir politique souverain** disposant du monopole de la contrainte physique légitime.',
      '**Séparation des pouvoirs (Montesquieu)** : Distinction stricte ou souple entre le pouvoir **législatif** (voter les lois), le pouvoir **exécutif** (appliquer les lois et diriger l\'administration) et le pouvoir **judiciaire** (trancher les litiges en toute indépendance).',
      '**Pyramide de Kelsen (Hiérarchie des normes)** :\n  Constitution > Traités Internationaux > Lois Organiques > Lois Ordinaires > Décrets > Arrêtés ministériels/locaux.',
      '**Régimes politiques** : Régime présidentiel (séparation stricte, pas de responsabilité politique du gouvernement), régime parlementaire (séparation souple, dissolution et motion de censure réciproques), régime semi-présidentiel.'
    ],
    detailedExplanation: 'La Constitution est la norme suprême de l\'ordre juridique interne. Le contrôle de constitutionnalité confié à une Cour Constitutionnelle garantit qu\'aucune loi ne puisse être promulguée en contradiction avec les principes fondamentaux.'
  },
  {
    id: 'medecine_cardiologie_physio',
    keywords: ['coeur', 'cardiologie', 'cardiovasculaire', 'debit cardiaque', 'pression arterielle', 'pouls', 'ventricule', 'oreillette', 'systole', 'diastole', 'circulation'],
    faculty: 'Médecine & Sciences de la Santé',
    title: 'Physiologie Cardiovasculaire, Débit Cardiaque & Hémodynamique',
    definition: 'Le système cardiovasculaire assure le transport continu du sang, des nutriments, de l\'oxygène (O₂), du dioxyde de carbone (CO₂), des hormones et des déchets métaboliques à travers l\'organisme grâce à une pompe musculaire centrale : le cœur.',
    principles: [
      '**Anatomie fonctionnelle des 4 cavités** : Deux oreillettes (atria) réceptrices et deux ventricules éjecteurs séparés par les valves atrio-ventriculaires (mitrale et tricuspide) et sigmoïdes (aortique et pulmonaire).',
      '**Révolution cardiaque** : Alternance continue entre la **systole** (contraction ventriculaire et éjection sanguine) et la **diastole** (relaxation ventriculaire et remplissage passif/actif).',
      '**Double circulation** : La petite circulation (pulmonaire : cœur droit → poumons pour hématose → cœur gauche) et la grande circulation (systémique : cœur gauche → organes → cœur droit).',
      '**Régulation de la pression artérielle (PA)** : Déterminée par le débit cardiaque et les résistances vasculaires périphériques : `PA = DC · RVP`.'
    ],
    formulas: [
      'DC = FC · VES (Débit cardiaque = Fréquence cardiaque × Volume d\'éjection systolique)',
      'PAM = (PAS + 2 · PAD) / 3 (Pression Artérielle Moyenne)',
      'PA = DC · RVP (Loi hémodynamique fondamentale)',
      'FE = (VES / VTD) · 100 (Fraction d\'éjection ventriculaire gauche, normale ≥ 55%)'
    ],
    practicalExample: 'Chez un adulte sain au repos avec une fréquence cardiaque FC = 70 bpm et un volume d\'éjection VES = 70 mL : Débit cardiaque DC = 70 × 0.070 = 4.9 L/min (environ 5 litres de sang pompés par minute).',
    detailedExplanation: 'Le système cardionecteur autonome (nœud sinusal de Keith et Flack → nœud atrio-ventriculaire d\'Aschoff-Tawara → faisceau de His → réseau de Purkinje) génère spontanément et propage l\'onde de dépolarisation électrique assurant le rythme cardiaque.'
  },
  {
    id: 'economie_macro_inflation_pib',
    keywords: ['pib', 'inflation', 'macroeconomie', 'economie', 'croissance', 'chomage', 'taux d\'interet', 'monnaie', 'banque centrale', 'offre', 'demande', 'elasticite'],
    faculty: 'Économie & Gestion',
    title: 'Macroéconomie Fondamentale, PIB, Inflation & Politiques Économiques',
    definition: 'La macroéconomie étudie le fonctionnement global de l\'économie à travers des agrégats majeurs tels que le Produit Intérieur Brut (PIB), le taux d\'inflation, le niveau de l\'emploi/chômage, la balance commerciale et les taux d\'intérêt.',
    principles: [
      '**Le Produit Intérieur Brut (PIB)** : Mesure de la richesse totale produite sur un territoire au cours d\'une période donnée. Selon l\'approche par la demande : `PIB = C + I + G + (X - M)`.',
      '**L\'Inflation** : Hausse généralisée et auto-entretenue du niveau des prix des biens et services, mesurée par l\'Indice des Prix à la Consommation (IPC).',
      '**Les 3 causes majeures de l\'inflation** :\n  1. Inflation par la **demande** (demande globale excédant les capacités productives de l\'offre).\n  2. Inflation par les **coûts** (hausse des matières premières, énergie ou salaires).\n  3. Inflation par la **création monétaire** (croissance excessive de la masse monétaire M3).',
      '**Le Carré Magique de Nicholas Kaldor** : Les 4 objectifs macroéconomiques idéaux : Croissance économique soutenue, Plein emploi, Stabilité des prix, Équilibre extérieur.'
    ],
    formulas: [
      'PIB = C + I + G + (X - M) (Consommation + Investissement + Dépenses publiques + Exportations nettes)',
      'Taux d\'inflation = ((IPC_t - IPC_(t-1)) / IPC_(t-1)) · 100',
      'Élasticité-prix de la demande = (ΔQ / Q) / (ΔP / P)',
      'Équation quantitative de la monnaie (Fisher) : M · V = P · T'
    ],
    practicalExample: 'Si l\'indice IPC passe de 120 en 2025 à 126 en 2026, le taux d\'inflation annuel est égal à ((126 - 120) / 120) × 100 = 5.0 %.',
    detailedExplanation: 'Pour lutter contre une surchauffe inflationniste, la Banque Centrale mène une politique monétaire restrictive en relevant ses taux directeurs, ce qui freine le crédit et ralentit la demande globale.'
  },
  {
    id: 'informatique_algorithmes_code',
    keywords: ['algorithme', 'code', 'programmation', 'python', 'typescript', 'complexite', 'structure de donnees', 'fonction', 'variable', 'poo', 'base de donnees'],
    faculty: 'Informatique / Génie Logiciel',
    title: 'Algorithmique, Structures de Données & Génie Logiciel',
    definition: 'Un algorithme est une suite finie, non ambiguë et ordonnée d\'instructions permettant de résoudre un problème donné ou de transformer des données d\'entrée en résultats attendus.',
    principles: [
      '**Complexité algorithmique (Notation Grand O / Big-O)** : Mesure l\'efficacité temporelle et spatiale d\'un algorithme en fonction de la taille n des données (O(1) constant, O(log n) logarithmique, O(n) linéaire, O(n log n) quasi-linéaire, O(n²) quadratique).',
      '**Structures de données fondamentales** : Tableaux (accès direct O(1)), Listes chaînées (insertion rapide O(1)), Piles LIFO / Files FIFO, Tables de hachage / Dictionnaires (accès moyen O(1)), Arbres binaires de recherche (recherche en O(log n)).',
      '**Piliers de la Programmation Orientée Objet (POO)** :\n  1. **Encapsulation** (masquage de l\'état interne et protection des attributs).\n  2. **Héritage** (réutilisation et extension des comportements).\n  3. **Polymorphisme** (capacité d\'objets différents à répondre au même message).\n  4. **Abstraction** (modélisation simplifiée sans détails superflus).'
    ],
    formulas: [
      'Recherche binaire (dichotomie) : Complexité O(log₂ n)',
      'Tri rapide (Quicksort) / Tri fusion (Mergesort) : O(n · log n)'
    ],
    detailedExplanation: 'La conception logicielle moderne repose sur les principes SOLID et des architectures modulaires pour garantir la maintenabilité, l\'évolutivité et la tolérance aux pannes des systèmes distribués.'
  }
];

/**
 * Extracts question intent and cleans query
 */
export function analyzeQuestionIntent(rawQuery: string): {
  isQuestion: boolean;
  cleanSubject: string;
  questionType: 'definition' | 'explanation' | 'calculation' | 'comparison' | 'condition' | 'general';
} {
  const norm = rawQuery.trim().toLowerCase();

  // Pattern checks
  const isDef = /^(c[' ]?est quoi|c koi|qu[' ]?est[- ]ce que|keske|definition de|definir|sens de|nini yango)/i.test(norm);
  const isExpl = /^(explique|comment fonctionne|comment marche|pq|pourquoi|principe de|ndenge nini)/i.test(norm);
  const isCalc = /^(calcule|calculer|combien vaut|trouve|resous|derive|conversion|convertis|formule de)/i.test(norm);
  const isComp = /^(difference entre|diff|compare|comparaison|vs|contre)/i.test(norm);
  const isCond = /^(quelles sont les conditions|quels sont les|donne[- ]moi les|citer|liste)/i.test(norm);

  let qType: 'definition' | 'explanation' | 'calculation' | 'comparison' | 'condition' | 'general' = 'general';
  if (isCalc) qType = 'calculation';
  else if (isDef) qType = 'definition';
  else if (isComp) qType = 'comparison';
  else if (isExpl) qType = 'explanation';
  else if (isCond) qType = 'condition';

  // Strip question stop phrases to isolate key subject
  let cleanSubject = norm
    .replace(/^(c[' ]?est quoi|c koi|qu[' ]?est[- ]ce que|qu[' ]?est[- ]ce qu[' ]?un[e]?|keske|definition de|definir|explique[- ]moi|explique|comment fonctionne|comment marche|comment calculer|donne[- ]moi|quels sont les|quelles sont les|citer les|parle[- ]moi de|aide[- ]moi sur)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim();

  if (!cleanSubject) cleanSubject = norm;

  const isQuestion = isDef || isExpl || isCalc || isComp || isCond || norm.includes('?') || norm.length > 15;

  return {
    isQuestion,
    cleanSubject,
    questionType: qType,
  };
}

/**
 * Main offline Q&A function
 * Combines: Math.js solver + Cosine Semantic Chunk Search + Comprehensive Academic Knowledge Graph + Synthesis Engine
 */
export function answerOfflineQuestion(
  rawQuery: string,
  options?: {
    chunks?: CourseChunk[];
    localCourses?: LocalCourse[];
    isBoss?: boolean;
    isQueen?: boolean;
    isUnlocked?: boolean;
    memory?: DakisMemory;
  }
): OfflineQAResponse {
  const query = (rawQuery || '').trim();
  if (!query) {
    return {
      answerText: "Posez votre question académique, scientifique ou juridique (ex: *C'est quoi la résistance des matériaux ?*, *Quelles sont les conditions de validité d'un contrat ?*, *Calculer q*L^2/8 avec q=12 L=6*, *Explique le débit cardiaque*).",
      intent: 'general',
      sourceMatches: [],
      mathResult: null,
    };
  }

  const { chunks = [], localCourses = [], isBoss, isQueen, isUnlocked, memory } = options || {};

  // 1. Math / Unit conversion detection
  const mathResult = solveOfflineMath(query, chunks);
  if (mathResult && mathResult.isMath) {
    let answerText = `### 🧮 Résolution Mathématique Hors-Ligne\n\n`;
    answerText += `**Résultat direct :** \`${mathResult.result}\`\n\n`;
    answerText += `#### 📋 Déroulé étape par étape :\n`;
    mathResult.steps.forEach((st) => {
      answerText += `- ${st}\n`;
    });
    if (mathResult.type === 'equation') {
      answerText += `\n*✨ Résolu via le moteur d'algèbre symbolique intégré sans connexion internet.*`;
    } else if (mathResult.type === 'unit_conversion') {
      answerText += `\n*🔄 Conversion conforme au Système International d'Unités (SI).*`;
    }

    return {
      answerText,
      intent: 'math_calc',
      subjectTitle: 'Calcul Mathématique Direct',
      sourceMatches: [],
      mathResult,
      confidence: 1.0,
      badge: 'VERT',
      canEnrichOnline: false,
    };
  }

  // 1.4. CHECK FOR MATCHES IN PRE-COMPILED REFLEX SHEETS (Fiches Réflexes Cliniques & Protocoles)
  const normQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const queryTokens = normQuery.split(/\W+/).filter((w) => w.length > 2);

  if (localCourses && localCourses.length > 0) {
    for (const course of localCourses) {
      if (course.reflexSheets && Array.isArray(course.reflexSheets)) {
        for (const sheet of course.reflexSheets) {
          const normTitle = (sheet.title + ' ' + sheet.topic + ' ' + sheet.definition).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          let hits = 0;
          for (const token of queryTokens) {
            if (normTitle.includes(token)) hits++;
          }
          const score = hits / Math.max(1, queryTokens.length);
          if (score >= 0.4) {
            let responseMd = `### 📋 FICHE RÉFLEXE CLINIQUE & PROTOCOLE\n`;
            responseMd += `**${sheet.title}** • *Document : ${course.title}${sheet.sourcePage ? ` (Page ${sheet.sourcePage})` : ''} • 100% Hors-Ligne*\n\n`;

            responseMd += `#### 🎯 1. Définition & Éléments Clés\n`;
            responseMd += `${sheet.definition}\n\n`;

            if (sheet.symptomsOrSigns && sheet.symptomsOrSigns.length > 0) {
              responseMd += `#### 🔍 2. Signes Cliniques & Anamnèse\n`;
              sheet.symptomsOrSigns.forEach((s) => {
                responseMd += `- ${s}\n`;
              });
              responseMd += `\n`;
            }

            if (sheet.clinicalTests && sheet.clinicalTests.length > 0) {
              responseMd += `#### 🩺 3. Bilans & Tests Recommandés\n`;
              sheet.clinicalTests.forEach((t) => {
                responseMd += `- **Test / Bilan :** ${t}\n`;
              });
              responseMd += `\n`;
            }

            if (sheet.redFlags && sheet.redFlags.length > 0) {
              responseMd += `#### ⚠️ 4. Drapeaux Rouges (Red Flags) & Contre-indications\n`;
              sheet.redFlags.forEach((rf) => {
                responseMd += `- **${rf}**\n`;
              });
              responseMd += `\n`;
            }

            if (sheet.protocolOrActionPlan && sheet.protocolOrActionPlan.length > 0) {
              responseMd += `#### 🏋️ 5. Protocole de Rééducation & Démarche Thérapeutique\n`;
              sheet.protocolOrActionPlan.forEach((p, idx) => {
                responseMd += `${idx + 1}. ${p}\n`;
              });
              responseMd += `\n`;
            }

            responseMd += `*(Fiche générée et validée dans votre Cerveau de Cours pour révision hors-ligne).*`;

            return {
              answerText: responseMd,
              intent: 'explanation',
              subjectTitle: sheet.title,
              sourceMatches: [],
              mathResult: null,
              confidence: 0.95,
              badge: 'VERT',
              sourceExcerpt: sheet.definition,
              sourcePage: sheet.sourcePage || 1,
              sourceCourseId: course.id,
              canEnrichOnline: false,
              suggestedFollowUps: [
                `Voir les cas cliniques sur ce cours`,
                `Faire le quiz QCM de ${course.title}`,
                `Consulter les flashcards associées`,
              ],
            };
          }
        }
      }
    }
  }

  // 1.5. CHECK FOR MATCHES IN PRE-GENERATED ANTICIPATED Q&A (From Gemini Course Analysis)
  if (localCourses && localCourses.length > 0) {
    let bestQA: { question: string; answer: string; courseTitle: string; courseId: string; faculty: string; page?: number; score: number; verbatim?: string; confidence?: number } | null = null;

    for (const course of localCourses) {
      if (course.anticipatedQA && Array.isArray(course.anticipatedQA)) {
        for (const qa of course.anticipatedQA) {
          const normQ = qa.question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          let hits = 0;
          for (const token of queryTokens) {
            if (normQ.includes(token)) hits++;
          }
          const score = hits / Math.max(1, queryTokens.length);
          if (score > 0.4 && (!bestQA || score > bestQA.score)) {
            bestQA = {
              question: qa.question,
              answer: qa.answer,
              courseTitle: course.title,
              courseId: course.id,
              faculty: course.faculty,
              page: qa.sourcePage,
              verbatim: qa.verbatim,
              confidence: qa.confidence,
              score,
            };
          }
        }
      }
    }

    if (bestQA && bestQA.score >= 0.45) {
      const conf = Math.max(0.85, bestQA.confidence || (0.8 + bestQA.score * 0.15));
      let responseMd = `### ⚡ Réponse Anticipée par l'IA (DAKIS Offline Intelligence)\n`;
      responseMd += `*Document source : **${bestQA.courseTitle}** (${bestQA.faculty})${bestQA.page ? ` • Page ${bestQA.page}` : ''} • 100% Hors-Ligne*\n\n`;
      responseMd += `#### ❓ Question d'examen anticipée :\n`;
      responseMd += `**${bestQA.question}**\n\n`;
      responseMd += `#### 💡 Réponse & Démonstration Complète :\n`;
      responseMd += `${bestQA.answer}\n\n`;
      if (bestQA.verbatim) {
        responseMd += `#### 📖 Citation Verbatim du Document :\n> "${bestQA.verbatim}"\n\n`;
      }
      responseMd += `*(Cette réponse a été anticipée et vérifiée dans votre document pour révision sans réseau).*`;

      return {
        answerText: responseMd,
        intent: 'explanation',
        subjectTitle: bestQA.courseTitle,
        sourceMatches: [],
        mathResult: null,
        confidence: conf,
        badge: 'VERT',
        sourceExcerpt: bestQA.verbatim || bestQA.answer.slice(0, 300),
        sourcePage: bestQA.page || 1,
        sourceCourseId: bestQA.courseId,
        canEnrichOnline: false,
        suggestedFollowUps: [
          `Faire le quiz sur ${bestQA.courseTitle}`,
          `Voir les fiches réflexes de ce cours`,
          `Ouvrir ce document dans le lecteur PDF`,
        ],
      };
    }
  }

  // 2. Perform Cosine Similarity + Keyword Search on indexed chunks
  const searchResults = searchOfflineChunks(query, chunks);
  const topMatches = searchResults.matches.slice(0, 4);

  // 3. Question Intent & Subject Analysis
  const intentInfo = analyzeQuestionIntent(query);
  const expandedQuery = expandAndNormalizeQuery(query);

  // 4. Find Best Matching Academic Topic from Built-in Knowledge Base
  let bestTopic: AcademicTopic | null = null;
  let highestTopicScore = 0;

  for (const topic of ACADEMIC_KNOWLEDGE_BASE) {
    let matchHits = 0;
    for (const kw of topic.keywords) {
      if (expandedQuery.includes(kw) || intentInfo.cleanSubject.includes(kw)) {
        matchHits += kw.length > 4 ? 3 : 1;
      }
    }
    if (matchHits > highestTopicScore) {
      highestTopicScore = matchHits;
      bestTopic = topic;
    }
  }

  // 5. SYNTHESIS GENERATION

  // CASE A: We matched a structured Academic Topic
  if (bestTopic && highestTopicScore >= 2) {
    let responseMd = `### 📚 ${bestTopic.title}\n`;
    responseMd += `*Faculté : ${bestTopic.faculty} • Mode Hors-Ligne 100% Autonome*\n\n`;

    responseMd += `#### 🎯 Définition & Concept Fondamental\n`;
    responseMd += `${bestTopic.definition}\n\n`;

    responseMd += `#### 📌 Principes & Éléments Clés\n`;
    bestTopic.principles.forEach((p) => {
      responseMd += `- ${p}\n`;
    });
    responseMd += `\n`;

    if (bestTopic.formulas && bestTopic.formulas.length > 0) {
      responseMd += `#### 📐 Formules & Relations Fondamentales\n`;
      bestTopic.formulas.forEach((f) => {
        responseMd += `- \`${f}\`\n`;
      });
      responseMd += `\n`;
    }

    if (bestTopic.practicalExample) {
      responseMd += `#### 💡 Application & Exemple Concret\n`;
      responseMd += `${bestTopic.practicalExample}\n\n`;
    }

    responseMd += `#### 🔍 Approfondissement\n`;
    responseMd += `${bestTopic.detailedExplanation}\n\n`;

    // If we also found exact page matches in local course PDFs, append source citations!
    if (topMatches.length > 0) {
      responseMd += `---\n#### 📖 Extraits de vos cours enregistrés (${topMatches[0].courseTitle}) :\n`;
      topMatches.forEach((m, idx) => {
        responseMd += `> **Page ${m.pageNumber}** : "${m.highlight || m.text.slice(0, 220)}..."\n\n`;
      });
    }

    return {
      answerText: responseMd,
      intent: 'explanation',
      subjectTitle: bestTopic.title,
      keyPoints: bestTopic.principles,
      formulas: bestTopic.formulas,
      sourceMatches: topMatches,
      mathResult: null,
      confidence: 0.88,
      badge: 'VERT',
      sourceExcerpt: bestTopic.definition,
      canEnrichOnline: false,
      suggestedFollowUps: [
        `Comment calculer avec ces formules ?`,
        `Donne-moi un quiz sur ${bestTopic.title}`,
        `Voir les extraits détaillés du cours`,
      ],
    };
  }

  // CASE B: We have matching chunks from user-uploaded PDFs or Official Library
  if (topMatches.length > 0 && topMatches[0].score >= 0.25) {
    const mainMatch = topMatches[0];
    const rawScore = mainMatch.score;
    // Map score to 0.50 - 0.90
    const confidence = rawScore >= 0.6 ? 0.85 : (rawScore >= 0.35 ? 0.72 : 0.55);
    const badge: 'VERT' | 'ORANGE' | 'ROUGE' = confidence > 0.80 ? 'VERT' : (confidence >= 0.60 ? 'ORANGE' : 'ROUGE');

    let synthesizedText = `### 📖 Réponse synthétisée depuis vos cours\n`;
    synthesizedText += `*Source principale : **${mainMatch.courseTitle}** (Page ${mainMatch.pageNumber})*\n\n`;

    synthesizedText += `#### 🎯 Éléments trouvés dans le document :\n\n`;

    topMatches.forEach((match, idx) => {
      synthesizedText += `**Point ${idx + 1} (Page ${match.pageNumber}) :**\n`;
      synthesizedText += `> ${match.text}\n\n`;
    });

    synthesizedText += `#### 💡 Synthèse DAKIS AI :\n`;
    synthesizedText += `D'après vos cours enregistrés, ces passages répondent directement à votre question sur **"${intentInfo.cleanSubject}"**. Vous pouvez consulter l'extrait complet ou lancer un **Quiz d'entraînement** dans l'onglet Outils d'Étude.`;

    return {
      answerText: synthesizedText,
      intent: 'question',
      subjectTitle: mainMatch.courseTitle,
      sourceMatches: topMatches,
      mathResult: null,
      confidence,
      badge,
      sourceExcerpt: mainMatch.text,
      sourcePage: mainMatch.pageNumber,
      sourceCourseId: mainMatch.courseId,
      canEnrichOnline: badge !== 'VERT',
      suggestedFollowUps: [
        `Faire un résumé en 10 points de ${mainMatch.courseTitle}`,
        `Lancer un quiz QCM sur ce cours`,
      ],
    };
  }

  // CASE C: Fallback with Anti-Hallucination ROUGE Badge
  let fallbackText = `### ⚠️ Information non présente dans vos cours offline\n\n`;
  fallbackText += `Cette question spécifique n'a pas pu être recoupée avec une certitude absolue dans vos documents enregistrés hors-ligne.\n\n`;
  fallbackText += `Pour éviter toute hallucination ou réponse approximative, DAKIS a classé cette réponse en **Non vérifiée** (< 60%).\n\n`;
  fallbackText += `👉 **Action recommandée :** Cliquez sur **"Repasser en ligne"** dès que vous aurez du réseau pour que Gemini analyse votre cours complet et enregistre définitivement la réponse vérifiée dans votre kit offline !`;

  return {
    answerText: fallbackText,
    intent: 'general',
    sourceMatches: [],
    mathResult: null,
    confidence: 0.35,
    badge: 'ROUGE',
    canEnrichOnline: true,
  };
}

/**
 * High-level offline processing function used by chat controllers.
 */
export async function processOfflineQuery(
  question: string,
  courses: LocalCourse[] = [],
  chunks: CourseChunk[] = [],
  memory?: DakisMemory,
  extraOptions?: { isBoss?: boolean; isQueen?: boolean; isUnlocked?: boolean }
): Promise<OfflineQAResponse> {
  return answerOfflineQuestion(question, {
    localCourses: courses,
    chunks,
    memory,
    ...extraOptions,
  });
}

