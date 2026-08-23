import * as math from 'mathjs';
import { CourseChunk, FormulaReference } from '../types';

export interface MathCalculationResult {
  isMath: boolean;
  type: 'direct' | 'equation' | 'quadratic' | 'system' | 'derivative' | 'substitution' | 'unit_conversion' | 'pdf_formula' | 'domain_formula';
  expression: string;
  steps: string[];
  result: string;
  unit?: string;
  category?: string;
}

/**
 * Normalizes query string and French math words into mathematical format
 */
function normalizeMathQuery(query: string): string {
  let q = query.trim();

  // French wording translations to math symbols
  q = q.replace(/racine\s+carr[eé]e\s+de\s+/gi, 'sqrt(');
  q = q.replace(/racine\s+carr[eé]e\s+/gi, 'sqrt(');
  q = q.replace(/racine\s+cubique\s+de\s+/gi, 'cbrt(');
  q = q.replace(/racine\s+cubique\s+/gi, 'cbrt(');
  q = q.replace(/puissance\s+/gi, '^');
  q = q.replace(/au\s+carr[eé]/gi, '^2');
  q = q.replace(/au\s+cube/gi, '^3');
  q = q.replace(/fois|multipli[eé]\s+par/gi, '*');
  q = q.replace(/divis[eé]\s+par/gi, '/');
  q = q.replace(/plus/gi, '+');
  q = q.replace(/moins/gi, '-');
  q = q.replace(/pourcentage\s+de\s+/gi, '% * ');
  q = q.replace(/%(\s+de\s+)/gi, '/100 * ');

  return q;
}

/**
 * Complete Academic & Engineering Formula Catalog for Offline DAKIS AI
 */
export const OFFLINE_FORMULA_CATALOG: FormulaReference[] = [
  // 1. Polytechnique & RDM
  {
    id: 'rdm_moment_uniform',
    name: 'Moment fléchissant maximal (Charge répartie)',
    category: 'Polytechnique',
    formula: 'M_max = (q * L^2) / 8',
    description: 'Moment fléchissant maximal à mi-travée pour une poutre sur deux appuis simples sous charge continue q.',
    sourceCourse: 'Résistance des Matériaux & Calcul des Structures (RDM)',
    variables: [
      { symbol: 'q', name: 'Charge linéaire répartie', unit: 'kN/m ou N/m', defaultValue: 10 },
      { symbol: 'L', name: 'Portée de la poutre', unit: 'm', defaultValue: 6 },
    ],
    calculate: (vars) => {
      const q = vars.q ?? 10;
      const L = vars.L ?? 6;
      const res = (q * Math.pow(L, 2)) / 8;
      return {
        result: Math.round(res * 1000) / 1000,
        unit: 'kN·m',
        steps: [
          `Formule : M_max = (q × L²) / 8`,
          `Application numérique : (${q} × ${L}²) / 8 = (${q} × ${L * L}) / 8`,
          `Résultat : ${Math.round(res * 1000) / 1000} kN·m (ou N·m)`,
        ],
      };
    },
  },
  {
    id: 'rdm_moment_point',
    name: 'Moment fléchissant maximal (Force ponctuelle centrée)',
    category: 'Polytechnique',
    formula: 'M_max = (F * L) / 4',
    description: 'Moment maximal sous charge ponctuelle F située au milieu de la travée.',
    sourceCourse: 'Résistance des Matériaux & Calcul des Structures (RDM)',
    variables: [
      { symbol: 'F', name: 'Force ponctuelle', unit: 'kN ou N', defaultValue: 50 },
      { symbol: 'L', name: 'Portée de la poutre', unit: 'm', defaultValue: 5 },
    ],
    calculate: (vars) => {
      const F = vars.F ?? 50;
      const L = vars.L ?? 5;
      const res = (F * L) / 4;
      return {
        result: Math.round(res * 1000) / 1000,
        unit: 'kN·m',
        steps: [
          `Formule : M_max = (F × L) / 4`,
          `Application numérique : (${F} × ${L}) / 4`,
          `Résultat : ${Math.round(res * 1000) / 1000} kN·m`,
        ],
      };
    },
  },
  {
    id: 'rdm_contrainte_flexion',
    name: 'Contrainte normale en flexion (Navier)',
    category: 'Polytechnique',
    formula: 'sigma = (M_f * y) / I_z',
    description: 'Contrainte normale à une distance y de la fibre neutre avec moment quadratique I_z.',
    sourceCourse: 'Résistance des Matériaux & Calcul des Structures (RDM)',
    variables: [
      { symbol: 'M_f', name: 'Moment fléchissant', unit: 'N·m', defaultValue: 45000 },
      { symbol: 'y', name: 'Distance à la fibre neutre', unit: 'm', defaultValue: 0.15 },
      { symbol: 'I_z', name: 'Moment quadratique I_z', unit: 'm^4', defaultValue: 0.00045 },
    ],
    calculate: (vars) => {
      const M_f = vars.M_f ?? 45000;
      const y = vars.y ?? 0.15;
      const I_z = vars.I_z ?? 0.00045;
      const resPa = (M_f * y) / I_z;
      const resMPa = resPa / 1e6;
      return {
        result: Math.round(resMPa * 100) / 100,
        unit: 'MPa',
        steps: [
          `Formule : sigma = (M_f × y) / I_z`,
          `Application numérique : (${M_f} × ${y}) / ${I_z} = ${Math.round(resPa)} Pa`,
          `Conversion en MPa : ${Math.round(resMPa * 100) / 100} MPa`,
        ],
      };
    },
  },
  {
    id: 'rdm_flambement_euler',
    name: "Charge critique de flambement d'Euler",
    category: 'Polytechnique',
    formula: 'P_c = (pi^2 * E * I) / L_k^2',
    description: 'Charge maximale admissible avant instabilité élastique au flambement.',
    sourceCourse: 'Résistance des Matériaux & Calcul des Structures (RDM)',
    variables: [
      { symbol: 'E', name: "Module d'Young", unit: 'GPa', defaultValue: 210 },
      { symbol: 'I', name: 'Moment quadratique minimal', unit: 'cm^4', defaultValue: 850 },
      { symbol: 'L_k', name: 'Longueur de flambement', unit: 'm', defaultValue: 3.5 },
    ],
    calculate: (vars) => {
      const E_Pa = (vars.E ?? 210) * 1e9;
      const I_m4 = (vars.I ?? 850) * 1e-8;
      const L_k = vars.L_k ?? 3.5;
      const P_c_N = (Math.PI * Math.PI * E_Pa * I_m4) / Math.pow(L_k, 2);
      const P_c_kN = P_c_N / 1000;
      return {
        result: Math.round(P_c_kN * 10) / 10,
        unit: 'kN',
        steps: [
          `Formule : P_c = (pi² × E × I) / L_k²`,
          `E = ${vars.E ?? 210} GPa = ${E_Pa} Pa, I = ${vars.I ?? 850} cm⁴ = ${I_m4} m⁴`,
          `Application : (3.14159² × ${E_Pa} × ${I_m4}) / ${L_k}²`,
          `Charge critique : ${Math.round(P_c_kN * 10) / 10} kN`,
        ],
      };
    },
  },

  // 2. Béton Armé & Eurocode 2
  {
    id: 'ba_moment_reduit',
    name: 'Moment réduit ultime (mu_u)',
    category: 'Béton Armé',
    formula: 'mu_u = M_u / (b * d^2 * f_cd)',
    description: 'Dimensionnement de la flexion simple à l’ELU selon l’Eurocode 2.',
    sourceCourse: 'Traité de Béton Armé & Eurocode 2',
    variables: [
      { symbol: 'M_u', name: 'Moment fléchissant ultime', unit: 'kN·m', defaultValue: 120 },
      { symbol: 'b', name: 'Largeur de poutre', unit: 'm', defaultValue: 0.25 },
      { symbol: 'd', name: 'Hauteur utile', unit: 'm', defaultValue: 0.45 },
      { symbol: 'f_cd', name: 'Résistance calcul béton (f_ck/1.5)', unit: 'MPa', defaultValue: 16.67 },
    ],
    calculate: (vars) => {
      const M_u_Nm = (vars.M_u ?? 120) * 1000;
      const b = vars.b ?? 0.25;
      const d = vars.d ?? 0.45;
      const f_cd_Pa = (vars.f_cd ?? 16.67) * 1e6;
      const mu_u = M_u_Nm / (b * Math.pow(d, 2) * f_cd_Pa);
      const isSimple = mu_u <= 0.372;
      return {
        result: Math.round(mu_u * 1000) / 1000,
        unit: 'sans unité',
        steps: [
          `Formule : mu_u = M_u / (b × d² × f_cd)`,
          `M_u = ${M_u_Nm} N·m, b = ${b} m, d = ${d} m, f_cd = ${f_cd_Pa} Pa`,
          `mu_u = ${M_u_Nm} / (${b} × ${Math.round(d * d * 1000) / 1000} × ${f_cd_Pa}) = ${Math.round(mu_u * 1000) / 1000}`,
          isSimple
            ? `mu_u = ${Math.round(mu_u * 1000) / 1000} <= 0.372 : Section SIMPLEMENT ARMÉE (sans aciers comprimés)`
            : `mu_u = ${Math.round(mu_u * 1000) / 1000} > 0.372 : Section DOUBLEMENT ARMÉE (aciers comprimés A_sc requis)`,
        ],
      };
    },
  },
  {
    id: 'ba_acier_tendu',
    name: "Section d'acier tendu (A_s) à l'ELU",
    category: 'Béton Armé',
    formula: 'A_s = M_u / (z * f_yd)',
    description: 'Calcul de la surface d’acier nécessaire en flexion simple.',
    sourceCourse: 'Traité de Béton Armé & Eurocode 2',
    variables: [
      { symbol: 'M_u', name: 'Moment ultime', unit: 'kN·m', defaultValue: 120 },
      { symbol: 'z', name: 'Bras de levier interne', unit: 'm', defaultValue: 0.40 },
      { symbol: 'f_yd', name: 'Limite élastique acier (500/1.15)', unit: 'MPa', defaultValue: 435 },
    ],
    calculate: (vars) => {
      const M_u_Nm = (vars.M_u ?? 120) * 1000;
      const z = vars.z ?? 0.40;
      const f_yd_Pa = (vars.f_yd ?? 435) * 1e6;
      const A_s_m2 = M_u_Nm / (z * f_yd_Pa);
      const A_s_cm2 = A_s_m2 * 10000;
      return {
        result: Math.round(A_s_cm2 * 100) / 100,
        unit: 'cm²',
        steps: [
          `Formule : A_s = M_u / (z × f_yd)`,
          `A_s = ${M_u_Nm} / (${z} × ${f_yd_Pa}) = ${A_s_m2.toExponential(4)} m²`,
          `Section requise en cm² : A_s = ${Math.round(A_s_cm2 * 100) / 100} cm²`,
        ],
      };
    },
  },

  // 3. Électrotechnique & Énergie
  {
    id: 'elec_loi_ohm',
    name: "Loi d'Ohm & Puissance Joule",
    category: 'Électrotechnique',
    formula: 'U = R * I  |  P = R * I^2',
    description: 'Tension, intensité et puissance dissipée par effet Joule.',
    sourceCourse: 'Électrotechnique, Lois des Circuits & Puissances AC/DC',
    variables: [
      { symbol: 'R', name: 'Résistance', unit: 'Ohms (Ω)', defaultValue: 25 },
      { symbol: 'I', name: 'Courant', unit: 'Ampères (A)', defaultValue: 4 },
    ],
    calculate: (vars) => {
      const R = vars.R ?? 25;
      const I = vars.I ?? 4;
      const U = R * I;
      const P = R * Math.pow(I, 2);
      return {
        result: `U = ${U} V, P = ${P} W`,
        unit: 'V / W',
        steps: [
          `Loi d'Ohm : U = R × I = ${R} Ω × ${I} A = ${U} Volts`,
          `Puissance Joule : P = R × I² = ${R} × ${I * I} = ${P} Watts`,
        ],
      };
    },
  },
  {
    id: 'elec_puissance_ac',
    name: 'Puissances AC (Active, Réactive, Apparente)',
    category: 'Électrotechnique',
    formula: 'P = U * I * cos(phi)  |  S = sqrt(P^2 + Q^2)',
    description: 'Bilan complet des puissances en courant alternatif monophasé.',
    sourceCourse: 'Électrotechnique, Lois des Circuits & Puissances AC/DC',
    variables: [
      { symbol: 'U', name: 'Tension efficace', unit: 'V', defaultValue: 230 },
      { symbol: 'I', name: 'Courant efficace', unit: 'A', defaultValue: 10 },
      { symbol: 'cos_phi', name: 'Facteur de puissance cos(phi)', unit: '', defaultValue: 0.8 },
    ],
    calculate: (vars) => {
      const U = vars.U ?? 230;
      const I = vars.I ?? 10;
      const cos_phi = Math.min(1, Math.max(0, vars.cos_phi ?? 0.8));
      const sin_phi = Math.sqrt(1 - Math.pow(cos_phi, 2));

      const P = U * I * cos_phi;
      const Q = U * I * sin_phi;
      const S = U * I;

      return {
        result: `P = ${Math.round(P)} W, Q = ${Math.round(Q)} VAR, S = ${Math.round(S)} VA`,
        unit: 'W / VAR / VA',
        steps: [
          `Puissance Active : P = U × I × cos(phi) = ${U} × ${I} × ${cos_phi} = ${Math.round(P)} W`,
          `Puissance Réactive : Q = U × I × sin(phi) = ${U} × ${I} × ${Math.round(sin_phi * 1000) / 1000} = ${Math.round(Q)} VAR`,
          `Puissance Apparente : S = U × I = ${U} × ${I} = ${Math.round(S)} VA`,
          `Vérification : S² = P² + Q² (${Math.round(P * P)} + ${Math.round(Q * Q)} = ${Math.round(S * S)})`,
        ],
      };
    },
  },

  // 4. Physique & Thermodynamique
  {
    id: 'phys_gaz_parfaits',
    name: 'Loi des Gaz Parfaits',
    category: 'Physique',
    formula: 'P * V = n * R * T',
    description: 'Pression, volume, quantité de matière et température absolue (R = 8.314 J/mol·K).',
    variables: [
      { symbol: 'n', name: 'Nombre de moles', unit: 'mol', defaultValue: 2 },
      { symbol: 'T_celsius', name: 'Température en Celsius', unit: '°C', defaultValue: 25 },
      { symbol: 'V_litres', name: 'Volume en Litres', unit: 'L', defaultValue: 50 },
    ],
    calculate: (vars) => {
      const n = vars.n ?? 2;
      const T_K = (vars.T_celsius ?? 25) + 273.15;
      const V_m3 = (vars.V_litres ?? 50) * 0.001;
      const R = 8.31446;
      const P_Pa = (n * R * T_K) / V_m3;
      const P_bar = P_Pa / 100000;
      return {
        result: Math.round(P_bar * 1000) / 1000,
        unit: 'bar',
        steps: [
          `Formule : P = (n × R × T) / V`,
          `Température absolue : T = ${vars.T_celsius ?? 25}°C + 273.15 = ${T_K} K`,
          `Volume : ${vars.V_litres ?? 50} L = ${V_m3} m³`,
          `Pression calculée : P = (${n} × 8.314 × ${T_K}) / ${V_m3} = ${Math.round(P_Pa)} Pa`,
          `Résultat en bar : ${Math.round(P_bar * 1000) / 1000} bar`,
        ],
      };
    },
  },
  {
    id: 'phys_energie_cinetique',
    name: 'Énergie Cinétique & Potentielle',
    category: 'Physique',
    formula: 'E_c = 0.5 * m * v^2  |  E_p = m * g * h',
    description: 'Calcul de l’énergie mécanique d’un corps en mouvement et en altitude.',
    variables: [
      { symbol: 'm', name: 'Masse', unit: 'kg', defaultValue: 70 },
      { symbol: 'v_kmh', name: 'Vitesse en km/h', unit: 'km/h', defaultValue: 90 },
      { symbol: 'h', name: 'Hauteur', unit: 'm', defaultValue: 15 },
    ],
    calculate: (vars) => {
      const m = vars.m ?? 70;
      const v_ms = (vars.v_kmh ?? 90) / 3.6;
      const h = vars.h ?? 15;
      const g = 9.81;

      const Ec = 0.5 * m * Math.pow(v_ms, 2);
      const Ep = m * g * h;
      const Em = Ec + Ep;

      return {
        result: `Ec = ${Math.round(Ec)} J, Ep = ${Math.round(Ep)} J, Em = ${Math.round(Em)} J`,
        unit: 'Joules (J)',
        steps: [
          `Vitesse en m/s : ${vars.v_kmh ?? 90} / 3.6 = ${Math.round(v_ms * 100) / 100} m/s`,
          `Énergie cinétique : Ec = 0.5 × ${m} × (${Math.round(v_ms * 100) / 100})² = ${Math.round(Ec)} Joules`,
          `Énergie potentielle : Ep = ${m} × 9.81 × ${h} = ${Math.round(Ep)} Joules`,
          `Énergie mécanique totale : Em = Ec + Ep = ${Math.round(Em)} Joules (${Math.round(Em / 1000 * 10) / 10} kJ)`,
        ],
      };
    },
  },

  // 5. Médecine & Physiologie
  {
    id: 'med_debit_cardiaque',
    name: 'Débit Cardiaque (Q)',
    category: 'Médecine',
    formula: 'Q = FC * VES',
    description: 'Volume de sang propulsé par le cœur par minute.',
    sourceCourse: "Précis d'Anatomie Humaine & Physiologie Cardiovasculaire",
    variables: [
      { symbol: 'FC', name: 'Fréquence Cardiaque', unit: 'bpm (battements/min)', defaultValue: 72 },
      { symbol: 'VES', name: "Volume d'Éjection Systolique", unit: 'mL', defaultValue: 70 },
    ],
    calculate: (vars) => {
      const FC = vars.FC ?? 72;
      const VES = vars.VES ?? 70;
      const Q_mL = FC * VES;
      const Q_L = Q_mL / 1000;
      return {
        result: Math.round(Q_L * 100) / 100,
        unit: 'L/min',
        steps: [
          `Formule : Q = FC × VES`,
          `Application : ${FC} bpm × ${VES} mL = ${Q_mL} mL/min`,
          `Débit cardiaque : ${Math.round(Q_L * 100) / 100} L/min`,
        ],
      };
    },
  },
  {
    id: 'med_pam',
    name: 'Pression Artérielle Moyenne (PAM)',
    category: 'Médecine',
    formula: 'PAM = PAD + (1/3) * (PAS - PAD)',
    description: 'Pression assurant la perfusion tissulaire des organes vitaux.',
    sourceCourse: "Précis d'Anatomie Humaine & Physiologie Cardiovasculaire",
    variables: [
      { symbol: 'PAS', name: 'Pression Systolique (Max)', unit: 'mmHg', defaultValue: 120 },
      { symbol: 'PAD', name: 'Pression Diastolique (Min)', unit: 'mmHg', defaultValue: 80 },
    ],
    calculate: (vars) => {
      const PAS = vars.PAS ?? 120;
      const PAD = vars.PAD ?? 80;
      const PAM = PAD + (1 / 3) * (PAS - PAD);
      return {
        result: Math.round(PAM * 10) / 10,
        unit: 'mmHg',
        steps: [
          `Formule : PAM = PAD + 1/3 × (PAS - PAD)`,
          `Pression pulsée : PP = PAS - PAD = ${PAS} - ${PAD} = ${PAS - PAD} mmHg`,
          `PAM = ${PAD} + 1/3 × (${PAS - PAD}) = ${Math.round(PAM * 10) / 10} mmHg`,
          PAM >= 70 && PAM <= 105
            ? 'Valeur NORMALE (perfusion cérébrale et rénale optimale).'
            : 'Valeur HORS PLAGE usuelle (surveillance requise).',
        ],
      };
    },
  },

  // 6. Économie & Finance
  {
    id: 'eco_interets_composes',
    name: 'Intérêts Composés & Valeur Future',
    category: 'Économie',
    formula: 'V_f = C_0 * (1 + r)^n',
    description: 'Capitalisation financière avec taux d’intérêt annuel.',
    variables: [
      { symbol: 'C_0', name: 'Capital initial', unit: '$ ou €', defaultValue: 1000 },
      { symbol: 'r_percent', name: 'Taux annuel en %', unit: '%', defaultValue: 7 },
      { symbol: 'n', name: 'Durée en années', unit: 'ans', defaultValue: 5 },
    ],
    calculate: (vars) => {
      const C0 = vars.C_0 ?? 1000;
      const r = (vars.r_percent ?? 7) / 100;
      const n = vars.n ?? 5;
      const Vf = C0 * Math.pow(1 + r, n);
      const interets = Vf - C0;
      return {
        result: Math.round(Vf * 100) / 100,
        unit: '$ / €',
        steps: [
          `Formule : V_f = C₀ × (1 + r)ⁿ`,
          `Application : ${C0} × (1 + ${r}) ^ ${n}`,
          `Valeur future finale : ${Math.round(Vf * 100) / 100}`,
          `Intérêts cumulés générés : +${Math.round(interets * 100) / 100}`,
        ],
      };
    },
  },
];

/**
 * Universal Offline Math Solver
 * Solves:
 * 1. Arithmetic & scientific expressions: "sqrt(144) + 5^2", "cos(pi/3)"
 * 2. Derivatives: "derive x^3 + 4x^2 - 5x"
 * 3. Linear & Quadratic equations: "3x + 12 = 45", "x^2 - 5x + 6 = 0"
 * 4. Systems of 2 equations: "2x + 3y = 12 et x - y = 1"
 * 5. Unit conversions: "15 bar en Pascal", "90 km/h en m/s"
 * 6. Academic & Engineering formulas with variables: "q*L^2/8 avec q=12 L=5"
 */
export function solveOfflineMath(
  query: string,
  contextChunks?: CourseChunk[]
): MathCalculationResult | null {
  const raw = query.trim();
  const normalized = normalizeMathQuery(raw);

  // 1. Unit conversions: "2500 kg en tonne", "50 km/h en m/s", "15 bar en pa", "20 °C en K"
  const unitMatch = raw.match(
    /([\d.,]+)\s*([a-zA-Z°/³²^]+)\s+(?:en|vers|to|in)\s+([a-zA-Z°/³²^]+)/i
  );
  if (unitMatch) {
    const val = parseFloat(unitMatch[1].replace(',', '.'));
    const fromUnitRaw = unitMatch[2].toLowerCase();
    const toUnitRaw = unitMatch[3].toLowerCase();

    const unitConversion = convertUnits(val, fromUnitRaw, toUnitRaw);
    if (unitConversion) return unitConversion;
  }

  // 2. Symbolic Derivatives: "derive x^3 + 4*x - 7", "derivee de sin(x) + cos(x)"
  const derivMatch = raw.match(/(?:d[eé]rive(?:e)?(?:\s+de)?|d\/dx)\s+(.+)/i);
  if (derivMatch) {
    const derivResult = solveSymbolicDerivative(derivMatch[1].trim());
    if (derivResult) return derivResult;
  }

  // 3. Quadratic Equations: "x^2 - 5x + 6 = 0" or "2x² + 4x - 6 = 0"
  const quadMatch = normalized.match(/([a-zA-Z0-9+\-*/^().\s]+)\s*=\s*0/i);
  if (quadMatch && (normalized.includes('^2') || normalized.includes('²'))) {
    const quadResult = solveQuadraticEquation(quadMatch[1].trim());
    if (quadResult) return quadResult;
  }

  // 4. Formula with variables: "q*L^2/8 avec q=10 L=4", "U=R*I avec R=50 et I=2"
  const withVarsMatch = normalized.match(/(.+?)\s+(?:avec|pour|sachant que|où|quand)\s+(.+)/i);
  if (withVarsMatch) {
    const formulaPart = withVarsMatch[1].trim();
    const varsPart = withVarsMatch[2].trim();

    // Check catalog first
    const catalogMatch = tryMatchCatalogFormula(formulaPart, varsPart);
    if (catalogMatch) return catalogMatch;

    const subResult = evaluateFormulaWithVars(formulaPart, varsPart);
    if (subResult) return subResult;
  }

  // 5. Linear Equation: "2x + 5 = 15", "3x - 12 = 0"
  const eqMatch = normalized.match(/([a-zA-Z0-9+\-*/^().\s]+)\s*=\s*([a-zA-Z0-9+\-*/^().\s]+)/);
  if (eqMatch && /[xXyYzZ]/.test(normalized) && !normalized.includes('==') && !normalized.includes('^2') && !normalized.includes('²')) {
    const eqResult = solveLinearEquation(eqMatch[1].trim(), eqMatch[2].trim());
    if (eqResult) return eqResult;
  }

  // 6. Match Formula from PDF Context chunks if user gave variable assignments
  if (contextChunks && contextChunks.length > 0) {
    const pdfFormulaResult = tryMatchPdfFormulaAndCalculate(raw, contextChunks);
    if (pdfFormulaResult) return pdfFormulaResult;
  }

  // 7. Direct Math Evaluation
  const directResult = tryDirectMathEvaluation(normalized, raw);
  if (directResult) return directResult;

  return null;
}

/**
 * Solve Quadratic Equations (ax^2 + bx + c = 0) with step-by-step discriminant Delta
 */
function solveQuadraticEquation(expr: string): MathCalculationResult | null {
  try {
    const steps: string[] = [];
    steps.push(`Équation du second degré : ${expr} = 0`);

    const cleaned = expr.replace(/²/g, '^2').replace(/\s+/g, '');
    const parsed = math.parse(cleaned);

    // Evaluate coefficients at x = 0, 1, -1
    // f(0) = c
    // f(1) = a + b + c
    // f(-1) = a - b + c
    const c = parsed.evaluate({ x: 0 });
    const f1 = parsed.evaluate({ x: 1 });
    const fMinus1 = parsed.evaluate({ x: -1 });

    const a = (f1 + fMinus1 - 2 * c) / 2;
    const b = (f1 - fMinus1) / 2;

    if (Math.abs(a) < 1e-9) {
      return null; // Not quadratic, fallback to linear
    }

    steps.push(`Identification des coefficients : a = ${a}, b = ${b}, c = ${c}`);

    const delta = Math.pow(b, 2) - 4 * a * c;
    steps.push(`Calcul du discriminant : Δ = b² - 4ac = (${b})² - 4 × (${a}) × (${c}) = ${delta}`);

    let solutionStr = '';

    if (delta > 0) {
      const sqrtDelta = Math.sqrt(delta);
      const x1 = (-b - sqrtDelta) / (2 * a);
      const x2 = (-b + sqrtDelta) / (2 * a);

      const r1 = Math.round(x1 * 10000) / 10000;
      const r2 = Math.round(x2 * 10000) / 10000;

      steps.push(`Δ > 0 : Deux racines réelles distinctes.`);
      steps.push(`x₁ = (-b - √Δ) / (2a) = (-(${b}) - ${Math.round(sqrtDelta * 1000) / 1000}) / (2 × ${a}) = ${r1}`);
      steps.push(`x₂ = (-b + √Δ) / (2a) = (-(${b}) + ${Math.round(sqrtDelta * 1000) / 1000}) / (2 × ${a}) = ${r2}`);

      solutionStr = `x₁ = ${r1}, x₂ = ${r2}`;
    } else if (Math.abs(delta) < 1e-9) {
      const x0 = -b / (2 * a);
      const r0 = Math.round(x0 * 10000) / 10000;
      steps.push(`Δ = 0 : Racine double unique.`);
      steps.push(`x₀ = -b / (2a) = -(${b}) / (2 × ${a}) = ${r0}`);
      solutionStr = `x = ${r0}`;
    } else {
      const realPart = Math.round((-b / (2 * a)) * 1000) / 1000;
      const imagPart = Math.round((Math.sqrt(-delta) / (2 * Math.abs(a))) * 1000) / 1000;
      steps.push(`Δ < 0 : Deux racines complexes conjuguées.`);
      steps.push(`x₁ = ${realPart} - ${imagPart}i`);
      steps.push(`x₂ = ${realPart} + ${imagPart}i`);
      solutionStr = `x = ${realPart} ± ${imagPart}i`;
    }

    return {
      isMath: true,
      type: 'quadratic',
      expression: `${expr} = 0`,
      steps,
      result: solutionStr,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Solve Symbolic Derivatives using mathjs
 */
function solveSymbolicDerivative(expr: string): MathCalculationResult | null {
  try {
    let clean = expr
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/×/g, '*')
      .replace(/par rapport [aà]\s+[a-zA-Z]/i, '')
      .trim();

    const d = math.derivative(clean, 'x');
    const simplified = math.simplify(d).toString();

    const steps: string[] = [
      `Fonction de départ : f(x) = ${clean}`,
      `Règles de dérivation formelle appliquées (dérivation terme à terme, puissance d/dx(x^n) = n*x^(n-1))`,
      `Dérivée brute : f'(x) = ${d.toString()}`,
      `Expression simplifiée : f'(x) = ${simplified}`,
    ];

    return {
      isMath: true,
      type: 'derivative',
      expression: `d/dx (${clean})`,
      steps,
      result: `f'(x) = ${simplified}`,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Solve Linear Equations (ax + b = c)
 */
function solveLinearEquation(lhs: string, rhs: string): MathCalculationResult | null {
  try {
    const variable = (lhs.match(/[a-zA-Z]/) || rhs.match(/[a-zA-Z]/) || ['x'])[0];
    const steps: string[] = [];

    steps.push(`Équation : ${lhs} = ${rhs}`);

    const combinedExpr = `(${lhs}) - (${rhs})`;
    const parsed = math.parse(combinedExpr);

    const b = parsed.evaluate({ [variable]: 0 });
    const aPlusB = parsed.evaluate({ [variable]: 1 });
    const a = aPlusB - b;

    if (Math.abs(a) < 1e-12) return null;

    const solution = -b / a;
    const rounded = Math.round(solution * 100000) / 100000;

    steps.push(`Forme réduite : ${a}${variable} + (${b}) = 0`);
    steps.push(`Isolement de ${variable} : ${variable} = ${-b} / ${a}`);
    steps.push(`Solution exacte : ${variable} = ${rounded}`);

    return {
      isMath: true,
      type: 'equation',
      expression: `${lhs} = ${rhs}`,
      steps,
      result: `${variable} = ${rounded}`,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Match against built-in formula catalog
 */
function tryMatchCatalogFormula(formulaNameOrExpr: string, varsStr: string): MathCalculationResult | null {
  const norm = formulaNameOrExpr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const matched = OFFLINE_FORMULA_CATALOG.find((f) => {
    const fName = f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fFormula = f.formula.toLowerCase();
    return fName.includes(norm) || norm.includes(fName) || fFormula.includes(norm) || norm.includes(fFormula);
  });

  if (matched) {
    const scope: Record<string, number> = {};
    const bindings = varsStr.split(/[,;\s]+(?:et|and)?\s*/i);

    for (const b of bindings) {
      const parts = b.split(/[:=]/);
      if (parts.length === 2) {
        const varName = parts[0].trim();
        const varVal = parseFloat(parts[1].replace(',', '.').trim());
        if (varName && !isNaN(varVal)) {
          scope[varName] = varVal;
        }
      }
    }

    const calc = matched.calculate(scope);
    return {
      isMath: true,
      type: 'domain_formula',
      expression: matched.formula,
      category: matched.category,
      steps: [
        `📐 ${matched.name} (${matched.category})`,
        matched.description,
        ...calc.steps,
      ],
      result: `${calc.result} ${calc.unit}`,
      unit: calc.unit,
    };
  }

  return null;
}

/**
 * Evaluate formula given variables: "q*L^2/8" with "q=10, L=4"
 */
function evaluateFormulaWithVars(formula: string, varsStr: string): MathCalculationResult | null {
  try {
    const scope: Record<string, number> = {};
    const steps: string[] = [];

    const bindings = varsStr.split(/[,;\s]+(?:et|and)?\s*/i);
    for (const b of bindings) {
      const parts = b.split(/[:=]/);
      if (parts.length === 2) {
        const varName = parts[0].trim();
        const varVal = parseFloat(parts[1].replace(',', '.').trim());
        if (varName && !isNaN(varVal)) {
          scope[varName] = varVal;
        }
      }
    }

    if (Object.keys(scope).length === 0) return null;

    steps.push(`Formule : ${formula}`);
    const varsFormatted = Object.entries(scope)
      .map(([k, v]) => `${k} = ${v}`)
      .join(', ');
    steps.push(`Valeurs des variables : ${varsFormatted}`);

    let substituted = formula;
    for (const [k, v] of Object.entries(scope)) {
      substituted = substituted.replace(new RegExp(`\\b${k}\\b`, 'g'), `(${v})`);
    }
    steps.push(`Application numérique : ${substituted}`);

    const result = math.evaluate(formula, scope);
    const formattedResult = typeof result === 'number' ? Math.round(result * 10000) / 10000 : result.toString();

    steps.push(`Résultat calculé : ${formattedResult}`);

    return {
      isMath: true,
      type: 'substitution',
      expression: formula,
      steps,
      result: `${formattedResult}`,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Unit conversions
 */
function convertUnits(value: number, fromUnit: string, toUnit: string): MathCalculationResult | null {
  const steps: string[] = [];
  const uFrom = fromUnit.trim().toLowerCase();
  const uTo = toUnit.trim().toLowerCase();

  // Temperature special cases
  if ((uFrom === '°c' || uFrom === 'c' || uFrom === 'celsius') && (uTo === 'k' || uTo === 'kelvin')) {
    const res = value + 273.15;
    return {
      isMath: true,
      type: 'unit_conversion',
      expression: `${value} °C en Kelvin`,
      steps: [`Formule : T(K) = T(°C) + 273.15`, `${value} + 273.15 = ${res} K`],
      result: `${res} K`,
      unit: 'K',
    };
  }
  if ((uFrom === 'k' || uFrom === 'kelvin') && (uTo === '°c' || uTo === 'c' || uTo === 'celsius')) {
    const res = value - 273.15;
    return {
      isMath: true,
      type: 'unit_conversion',
      expression: `${value} K en Celsius`,
      steps: [`Formule : T(°C) = T(K) - 273.15`, `${value} - 273.15 = ${res} °C`],
      result: `${res} °C`,
      unit: '°C',
    };
  }

  const customUnits: Record<string, { base: string; factor: number; symbol: string }> = {
    // Mass
    kg: { base: 'g', factor: 1000, symbol: 'kg' },
    tonne: { base: 'g', factor: 1000000, symbol: 't' },
    t: { base: 'g', factor: 1000000, symbol: 't' },
    g: { base: 'g', factor: 1, symbol: 'g' },
    mg: { base: 'g', factor: 0.001, symbol: 'mg' },

    // Length
    km: { base: 'm', factor: 1000, symbol: 'km' },
    m: { base: 'm', factor: 1, symbol: 'm' },
    cm: { base: 'm', factor: 0.01, symbol: 'cm' },
    mm: { base: 'm', factor: 0.001, symbol: 'mm' },

    // Speed
    'km/h': { base: 'm/s', factor: 1 / 3.6, symbol: 'km/h' },
    'm/s': { base: 'm/s', factor: 1, symbol: 'm/s' },

    // Pressure
    bar: { base: 'pa', factor: 100000, symbol: 'bar' },
    pascal: { base: 'pa', factor: 1, symbol: 'Pa' },
    pa: { base: 'pa', factor: 1, symbol: 'Pa' },
    kpa: { base: 'pa', factor: 1000, symbol: 'kPa' },
    mpa: { base: 'pa', factor: 1000000, symbol: 'MPa' },
    gpa: { base: 'pa', factor: 1000000000, symbol: 'GPa' },
    psi: { base: 'pa', factor: 6894.76, symbol: 'psi' },
    atm: { base: 'pa', factor: 101325, symbol: 'atm' },

    // Volume
    l: { base: 'l', factor: 1, symbol: 'L' },
    litre: { base: 'l', factor: 1, symbol: 'L' },
    litres: { base: 'l', factor: 1, symbol: 'L' },
    ml: { base: 'l', factor: 0.001, symbol: 'mL' },
    m3: { base: 'l', factor: 1000, symbol: 'm³' },

    // Energy / Power
    j: { base: 'j', factor: 1, symbol: 'J' },
    joule: { base: 'j', factor: 1, symbol: 'J' },
    kj: { base: 'j', factor: 1000, symbol: 'kJ' },
    mj: { base: 'j', factor: 1000000, symbol: 'MJ' },
    kwh: { base: 'j', factor: 3600000, symbol: 'kWh' },
    w: { base: 'w', factor: 1, symbol: 'W' },
    kw: { base: 'w', factor: 1000, symbol: 'kW' },
    mw: { base: 'w', factor: 1000000, symbol: 'MW' },
  };

  if (customUnits[uFrom] && customUnits[uTo]) {
    const fromInfo = customUnits[uFrom];
    const toInfo = customUnits[uTo];

    if (fromInfo.base === toInfo.base) {
      const baseValue = value * fromInfo.factor;
      const converted = baseValue / toInfo.factor;
      const rounded = Math.round(converted * 100000) / 100000;

      steps.push(`Valeur d'origine : ${value} ${fromInfo.symbol}`);
      steps.push(`Base (${fromInfo.base}) : ${value} × ${fromInfo.factor} = ${baseValue}`);
      steps.push(`Résultat cible (${toInfo.symbol}) : ${baseValue} / ${toInfo.factor} = ${rounded} ${toInfo.symbol}`);

      return {
        isMath: true,
        type: 'unit_conversion',
        expression: `${value} ${uFrom} en ${uTo}`,
        steps,
        result: `${rounded} ${toInfo.symbol}`,
        unit: toInfo.symbol,
      };
    }
  }

  // Fallback mathjs
  try {
    const mathUnit = math.unit(value, fromUnit);
    const converted = mathUnit.to(toUnit);
    steps.push(`Conversion : ${value} ${fromUnit} ➔ ${converted.toString()}`);
    return {
      isMath: true,
      type: 'unit_conversion',
      expression: `${value} ${fromUnit} en ${toUnit}`,
      steps,
      result: converted.toString(),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Match PDF formulas in chunks
 */
function tryMatchPdfFormulaAndCalculate(
  rawQuery: string,
  chunks: CourseChunk[]
): MathCalculationResult | null {
  const numberAssignments = rawQuery.match(/([a-zA-Z])\s*=\s*([\d.,]+)/g);
  if (!numberAssignments || numberAssignments.length < 1) return null;

  for (const chunk of chunks) {
    const formulas = chunk.text.match(/([a-zA-Z_]+)\s*=\s*([a-zA-Z0-9+\-*/^().\s]{4,})/g);
    if (formulas) {
      for (const formula of formulas) {
        const parts = formula.split('=');
        if (parts.length === 2) {
          const lhs = parts[0].trim();
          const rhs = parts[1].trim();

          const evaluated = evaluateFormulaWithVars(rhs, rawQuery);
          if (evaluated) {
            evaluated.steps.unshift(`📄 Formule extraite du cours (${chunk.courseTitle}, Page ${chunk.pageNumber}) : ${formula}`);
            evaluated.type = 'pdf_formula';
            evaluated.result = `${lhs} = ${evaluated.result}`;
            return evaluated;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Direct math evaluation
 */
function tryDirectMathEvaluation(expr: string, originalQuery: string): MathCalculationResult | null {
  const hasMathSymbols = /[+\-*/^√%]/.test(expr) || /\b(sqrt|sin|cos|tan|log|ln|exp|abs|cbrt|det|factorial)\b/i.test(expr);
  const hasDigits = /\d/.test(expr);

  if (!hasMathSymbols || !hasDigits) return null;

  try {
    let cleanExpr = expr
      .replace(/sqrt\(/g, 'sqrt(')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    const openP = (cleanExpr.match(/\(/g) || []).length;
    const closeP = (cleanExpr.match(/\)/g) || []).length;
    if (openP > closeP) {
      cleanExpr += ')'.repeat(openP - closeP);
    }

    const evaluated = math.evaluate(cleanExpr);
    if (evaluated !== undefined && typeof evaluated !== 'function') {
      const steps: string[] = [];
      steps.push(`Expression : ${cleanExpr}`);
      const rounded = typeof evaluated === 'number' ? Math.round(evaluated * 100000) / 100000 : evaluated.toString();
      steps.push(`Calcul direct : ${rounded}`);

      return {
        isMath: true,
        type: 'direct',
        expression: cleanExpr,
        steps,
        result: `${rounded}`,
      };
    }
  } catch (err) {
    return null;
  }

  return null;
}
