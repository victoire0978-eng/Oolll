import { ScientificSolverSolution } from '../types';

export interface SolvableTemplate {
  id: string;
  title: string;
  domain: 'Mathématiques' | 'Physique' | 'RDM & Structures' | 'Électronique & Circuits' | 'Thermodynamique' | 'Algorithmique';
  description: string;
  parameters: { key: string; label: string; unit: string; defaultValue: number; step?: number }[];
  solve: (inputs: Record<string, number>) => ScientificSolverSolution;
}

export const SCIENTIFIC_SOLVER_TEMPLATES: SolvableTemplate[] = [
  // 1. RDM - Poutre fléchie sous charge répartie
  {
    id: 'rdm_beam_uniform',
    title: 'Flexion Simple : Poutre bi-appuyée sous charge uniforme',
    domain: 'RDM & Structures',
    description: 'Calcul complet des réactions d\'appuis, du moment fléchissant maximal, de la contrainte normale maximale et de la flèche maximale.',
    parameters: [
      { key: 'q', label: 'Charge linéaire (q)', unit: 'kN/m', defaultValue: 15 },
      { key: 'L', label: 'Portée de la poutre (L)', unit: 'm', defaultValue: 6 },
      { key: 'b', label: 'Largeur section rectangulaire (b)', unit: 'cm', defaultValue: 20 },
      { key: 'h', label: 'Hauteur section rectangulaire (h)', unit: 'cm', defaultValue: 40 },
      { key: 'E', label: 'Module de Young (E)', unit: 'GPa', defaultValue: 210 },
    ],
    solve: (p) => {
      const q_N_m = p.q * 1000;
      const L_m = p.L;
      const b_m = p.b / 100;
      const h_m = p.h / 100;
      const E_Pa = p.E * 1e9;

      // Reactions
      const R_A = (q_N_m * L_m) / 2;
      // Moment Max at mid-span: M_max = q*L^2 / 8
      const M_max_Nm = (q_N_m * Math.pow(L_m, 2)) / 8;
      const M_max_kNm = M_max_Nm / 1000;

      // Inertia: I_z = b*h^3 / 12
      const I_z = (b_m * Math.pow(h_m, 3)) / 12;
      // Section Modulus: W_z = b*h^2 / 6
      const W_z = (b_m * Math.pow(h_m, 2)) / 6;

      // Stress: sigma_max = M_max / W_z (in MPa)
      const sigma_max_Pa = M_max_Nm / W_z;
      const sigma_max_MPa = sigma_max_Pa / 1e6;

      // Deflection: f_max = (5 * q * L^4) / (384 * E * I_z) (in mm)
      const f_max_m = (5 * q_N_m * Math.pow(L_m, 4)) / (384 * E_Pa * I_z);
      const f_max_mm = f_max_m * 1000;
      const ratio_deflection = L_m / f_max_m;

      return {
        problemTitle: `Flexion Poutre Isostatique (L=${p.L}m, q=${p.q}kN/m, section ${p.b}x${p.h}cm)`,
        domain: 'RDM & Structures',
        inputsGiven: {
          'Charge uniforme q': `${p.q} kN/m`,
          'Portée L': `${p.L} m`,
          'Section (b x h)': `${p.b} x ${p.h} cm`,
          'Module d\'Young E': `${p.E} GPa`,
        },
        hypothesisCheck: [
          '✓ Matériau homogène, isotrope et fonctionnant dans le domaine élastique linéaire (Loi de Hooke).',
          '✓ Hypothèse de Navier-Bernoulli : les sections droites restent planes et normales à la ligne moyenne.',
          '✓ Hypothèse des petites perturbations (déformations et déplacements infinitésimaux).',
          '✓ Symétrie géométrique et chargement dans le plan principal d\'inertie.',
        ],
        steps: [
          {
            title: 'Étape 1 : Calcul des Réactions d\'Appuis',
            formulaLatex: 'R_A = R_B = \\frac{q \\cdot L}{2}',
            explanation: 'Par symétrie et équilibre statique vertical (\\sum F_y = 0) :',
            intermediateResult: `R_A = R_B = (${p.q} \\times ${p.L}) / 2 = ${(R_A / 1000).toFixed(2)} kN (${R_A.toFixed(0)} N)`,
          },
          {
            title: 'Étape 2 : Équation du Moment Fléchissant et Moment Maximal',
            formulaLatex: 'M_f(x) = \\frac{q \\cdot L}{2}x - \\frac{q \\cdot x^2}{2} \\implies M_{\\max} = \\frac{q \\cdot L^2}{8}',
            explanation: 'Le moment fléchissant est maximal au centre de la poutre (x = L/2) où l\'effort tranchant V(x) s\'annule :',
            intermediateResult: `M_{max} = (${p.q} \\times ${p.L}^2) / 8 = ${M_max_kNm.toFixed(2)} kN·m (${M_max_Nm.toFixed(0)} N·m)`,
          },
          {
            title: 'Étape 3 : Propriétés Géométriques de la Section Droite',
            formulaLatex: 'I_z = \\frac{b \\cdot h^3}{12} \\quad \\text{et} \\quad W_z = \\frac{b \\cdot h^2}{6}',
            explanation: `Moment quadratique d'inertie et module de résistance à la flexion pour b = ${p.b} cm et h = ${p.h} cm :`,
            intermediateResult: `I_z = ${(I_z * 1e8).toFixed(1)} \\times 10^{-8} m^4 \\quad | \\quad W_z = ${(W_z * 1000).toFixed(4)} dm^3 = ${(W_z * 1e6).toFixed(0)} cm^3`,
          },
          {
            title: 'Étape 4 : Calcul de la Contrainte Normale Maximale',
            formulaLatex: '\\sigma_{\\max} = \\frac{M_{\\max}}{W_z} = \\frac{6 \\cdot M_{\\max}}{b \\cdot h^2}',
            explanation: 'La contrainte normale atteint son amplitude maximale sur les fibres extrêmes (traction en bas, compression en haut) :',
            intermediateResult: `\\sigma_{max} = ${M_max_Nm.toFixed(0)} / ${(W_z).toExponential(4)} = ${sigma_max_MPa.toFixed(2)} MPa`,
            pitfallWarning: sigma_max_MPa > 250 ? '⚠️ Alerte : La contrainte dépasse la limite élastique standard pour de l\'acier S235 ou du bois. Augmentez la hauteur h de la section !' : undefined,
          },
          {
            title: 'Étape 5 : Calcul de la Flèche Maximale (Déformation)',
            formulaLatex: 'f_{\\max} = \\frac{5 \\cdot q \\cdot L^4}{384 \\cdot E \\cdot I_z}',
            explanation: 'En intégrant 4 fois l\'équation différentielle de la ligne moyenne déformée E·I_z·y\'\'(x) = -M_f(x) :',
            intermediateResult: `f_{max} = ${f_max_mm.toFixed(2)} mm (Ratio de flèche = L / ${Math.round(ratio_deflection)})`,
            pitfallWarning: ratio_deflection < 300 ? '⚠️ La flèche dépasse le critère standard de confort admissible L/300. Risque de désordre esthétique ou de fissuration.' : '✓ Conforme au critère standard admissible (L/300 - L/500).',
          },
        ],
        finalResult: `Moment Max: ${M_max_kNm.toFixed(2)} kN·m | Contrainte Max: ${sigma_max_MPa.toFixed(2)} MPa | Flèche Max: ${f_max_mm.toFixed(2)} mm`,
        unit: 'kN·m / MPa / mm',
        keyTheorems: ['Théorème de Navier-Bernoulli', 'Loi de Hooke', 'Équations d\'équilibre de la statique de Cauchy', 'Équation différentielle d\'Euler-Bernoulli'],
      };
    },
  },

  // 2. Mathématiques - Intégrale par parties détaillée
  {
    id: 'math_integration_parts',
    title: 'Calcul Intégral : Intégration par parties (x · e^(ax))',
    domain: 'Mathématiques',
    description: 'Démonstration formelle pas-à-pas de l\'intégrale indéfinie et définie par application de la formule d\'intégration par parties.',
    parameters: [
      { key: 'a', label: 'Coefficient a dans e^(ax)', unit: 'constante', defaultValue: 2 },
      { key: 'x_start', label: 'Borne inférieure (x0)', unit: '', defaultValue: 0 },
      { key: 'x_end', label: 'Borne supérieure (x1)', unit: '', defaultValue: 1 },
    ],
    solve: (p) => {
      const a = p.a !== 0 ? p.a : 1;
      const x0 = p.x_start;
      const x1 = p.x_end;

      // Primitive F(x) = (x/a - 1/a^2) * e^(a*x)
      const F = (x: number) => (x / a - 1 / (a * a)) * Math.exp(a * x);
      const val = F(x1) - F(x0);

      return {
        problemTitle: `Calcul de l'intégrale I = ∫[${x0} à ${x1}] x · e^(${a}x) dx`,
        domain: 'Mathématiques',
        inputsGiven: {
          'Fonction à intégrer': `f(x) = x · e^(${a}x)`,
          'Borne inf': `${x0}`,
          'Borne sup': `${x1}`,
        },
        hypothesisCheck: [
          '✓ Les fonctions u(x) = x et v\'(x) = e^(ax) sont de classe C^1 sur l\'intervalle considéré.',
          '✓ Continuité et intégrabilité garanties sur tout domaine compact de ℝ.',
        ],
        steps: [
          {
            title: 'Étape 1 : Choix des fonctions u(x) et v\'(x) (Règle ALPES)',
            formulaLatex: '\\int u(x) v\'(x) dx = u(x) v(x) - \\int u\'(x) v(x) dx',
            explanation: `On pose :\n- u(x) = x \\implies u'(x) = 1\n- v'(x) = e^{${a}x} \\implies v(x) = \\frac{1}{${a}} e^{${a}x}`,
            intermediateResult: `u'(x) = 1 \\quad | \\quad v(x) = \\frac{1}{${a}} e^{${a}x}`,
          },
          {
            title: 'Étape 2 : Application de la Formule d\'Intégration par Parties',
            formulaLatex: `\\int x e^{${a}x} dx = \\left[ \\frac{x}{${a}} e^{${a}x} \\right] - \\int \\frac{1}{${a}} e^{${a}x} dx`,
            explanation: 'On développe le terme intégral restant qui est une exponentielle simple :',
            intermediateResult: `\\int \\frac{1}{${a}} e^{${a}x} dx = \\frac{1}{${a^2}} e^{${a}x}`,
          },
          {
            title: 'Étape 3 : Expression de la Primitive Globale F(x)',
            formulaLatex: `F(x) = e^{${a}x} \\left( \\frac{x}{${a}} - \\frac{1}{${a^2}} \\right) + C = \\frac{(${a}x - 1)}{${a^2}} e^{${a}x} + C`,
            explanation: 'Factorisation pour une écriture compacte et sans ambiguïté :',
            intermediateResult: `F(x) = \\frac{(${a}x - 1)}{${a^2}} e^{${a}x}`,
          },
          {
            title: 'Étape 4 : Évaluation entre les bornes [x0, x1]',
            formulaLatex: `I = F(${x1}) - F(${x0})`,
            explanation: `F(${x1}) = ${F(x1).toFixed(4)} et F(${x0}) = ${F(x0).toFixed(4)}`,
            intermediateResult: `I = ${F(x1).toFixed(4)} - (${F(x0).toFixed(4)}) = ${val.toFixed(4)}`,
          },
        ],
        finalResult: `Valeur exacte = [(${a}·${x1} - 1)/${a*a}]·e^(${a*x1}) - [(${a}·${x0} - 1)/${a*a}]·e^(${a*x0}) = ${val.toFixed(4)}`,
        unit: '',
        keyTheorems: ['Formule d\'intégration par parties de Leibniz', 'Théorème fondamental de l\'analyse', 'Règle mnémonique ALPES'],
      };
    },
  },

  // 3. Algèbre Linéaire - Résolution Système & Déterminant 3x3
  {
    id: 'linalg_matrix_det',
    title: 'Algèbre Linéaire : Déterminant 3x3 & Règle de Sarrus',
    domain: 'Mathématiques',
    description: 'Calcul détaillé du déterminant d\'une matrice carrée d\'ordre 3 par la méthode de Sarrus et le développement par cofacteurs.',
    parameters: [
      { key: 'a11', label: 'a11', unit: '', defaultValue: 2 },
      { key: 'a12', label: 'a12', unit: '', defaultValue: 1 },
      { key: 'a13', label: 'a13', unit: '', defaultValue: -1 },
      { key: 'a21', label: 'a21', unit: '', defaultValue: -3 },
      { key: 'a22', label: 'a22', unit: '', defaultValue: 4 },
      { key: 'a23', label: 'a23', unit: '', defaultValue: 2 },
      { key: 'a31', label: 'a31', unit: '', defaultValue: 1 },
      { key: 'a32', label: 'a32', unit: '', defaultValue: -2 },
      { key: 'a33', label: 'a33', unit: '', defaultValue: 3 },
    ],
    solve: (p) => {
      const { a11, a12, a13, a21, a22, a23, a31, a32, a33 } = p;
      // Sarrus
      const diag1 = a11 * a22 * a33;
      const diag2 = a12 * a23 * a31;
      const diag3 = a13 * a21 * a32;
      const sumPos = diag1 + diag2 + diag3;

      const anti1 = a13 * a22 * a31;
      const anti2 = a11 * a23 * a32;
      const anti3 = a12 * a21 * a33;
      const sumNeg = anti1 + anti2 + anti3;

      const det = sumPos - sumNeg;

      return {
        problemTitle: `Calcul du Déterminant det(A) pour la Matrice 3x3`,
        domain: 'Mathématiques',
        inputsGiven: {
          'Ligne 1': `[${a11}, ${a12}, ${a13}]`,
          'Ligne 2': `[${a21}, ${a22}, ${a23}]`,
          'Ligne 3': `[${a31}, ${a32}, ${a33}]`,
        },
        hypothesisCheck: [
          '✓ Matrice d\'ordre n=3 à coefficients dans ℝ.',
          det !== 0 ? '✓ det(A) ≠ 0 : La matrice est inversible (rang = 3).' : '⚠️ det(A) = 0 : Matrice singulière, non inversible (lignes/colonnes liées).',
        ],
        steps: [
          {
            title: 'Étape 1 : Diagonales descendantes directes (+)',
            formulaLatex: 'D_+ = a_{11}a_{22}a_{33} + a_{12}a_{23}a_{31} + a_{13}a_{21}a_{32}',
            explanation: `Produits des 3 diagonales principales :\n- (${a11} × ${a22} × ${a33}) = ${diag1}\n- (${a12} × ${a23} × ${a31}) = ${diag2}\n- (${a13} × ${a21} × ${a32}) = ${diag3}`,
            intermediateResult: `Somme directe = ${diag1} + ${diag2} + ${diag3} = ${sumPos}`,
          },
          {
            title: 'Étape 2 : Diagonales ascendantes inverses (-)',
            formulaLatex: 'D_- = a_{13}a_{22}a_{31} + a_{11}a_{23}a_{32} + a_{12}a_{21}a_{33}',
            explanation: `Produits des 3 anti-diagonales :\n- (${a13} × ${a22} × ${a31}) = ${anti1}\n- (${a11} × ${a23} × ${a32}) = ${anti2}\n- (${a12} × ${a21} × ${a33}) = ${anti3}`,
            intermediateResult: `Somme inverse = ${anti1} + ${anti2} + ${anti3} = ${sumNeg}`,
          },
          {
            title: 'Étape 3 : Calcul Final du Déterminant',
            formulaLatex: '\\det(A) = D_+ - D_-',
            explanation: 'Différence entre la somme directe et la somme inverse :',
            intermediateResult: `\\det(A) = ${sumPos} - (${sumNeg}) = ${det}`,
          },
        ],
        finalResult: `det(A) = ${det} (${det !== 0 ? 'Inversible, système de Cramer applicable' : 'Matrice singulière non inversible'})`,
        unit: '',
        keyTheorems: ['Règle de Sarrus pour matrices d\'ordre 3', 'Développement de Laplace par cofacteurs', 'Théorème d\'inversibilité matricielle'],
      };
    },
  },

  // 4. Électronique - Circuit RLC Série & Résonance
  {
    id: 'circuit_rlc_resonance',
    title: 'Électronique : Circuit RLC Série & Fréquence de Résonance',
    domain: 'Électronique & Circuits',
    description: 'Analyse d\'impédance complexe, pulsation propre, bande passante et facteur de qualité Q.',
    parameters: [
      { key: 'R', label: 'Résistance (R)', unit: 'Ω', defaultValue: 50 },
      { key: 'L_mH', label: 'Inductance (L)', unit: 'mH', defaultValue: 10 },
      { key: 'C_nF', label: 'Capacité (C)', unit: 'nF', defaultValue: 100 },
    ],
    solve: (p) => {
      const R = p.R;
      const L = p.L_mH * 1e-3;
      const C = p.C_nF * 1e-9;

      const omega_0 = 1 / Math.sqrt(L * C);
      const f_0 = omega_0 / (2 * Math.PI);
      const Q = (1 / R) * Math.sqrt(L / C);
      const delta_f = f_0 / Q;

      return {
        problemTitle: `Circuit RLC Série (R=${p.R}Ω, L=${p.L_mH}mH, C=${p.C_nF}nF)`,
        domain: 'Électronique & Circuits',
        inputsGiven: {
          'Résistance R': `${p.R} Ω`,
          'Inductance L': `${p.L_mH} mH (${L} H)`,
          'Capacité C': `${p.C_nF} nF (${C} F)`,
        },
        hypothesisCheck: [
          '✓ Régime sinusoïdal permanent en courant alternatif (CA).',
          '✓ Composants linéaires parfaits (résistance pure, bobine et condensateur idéaux).',
        ],
        steps: [
          {
            title: 'Étape 1 : Pulsation Propre de Résonance \\omega_0',
            formulaLatex: '\\omega_0 = \\frac{1}{\\sqrt{L \\cdot C}}',
            explanation: 'À la résonance, les impédances réactives de la bobine (jLω) et du condensateur (1/jCω) s\'annulent mutuellement :',
            intermediateResult: `\\omega_0 = 1 / \\sqrt{${L} \\times ${C}} = ${omega_0.toFixed(1)} rad/s`,
          },
          {
            title: 'Étape 2 : Fréquence de Résonance f_0',
            formulaLatex: 'f_0 = \\frac{\\omega_0}{2\\pi} = \\frac{1}{2\\pi \\sqrt{L \\cdot C}}',
            explanation: 'Conversion de la pulsation propre en fréquence en Hertz (Hz) :',
            intermediateResult: `f_0 = ${omega_0.toFixed(1)} / (2\\pi) = ${(f_0 / 1000).toFixed(2)} kHz (${f_0.toFixed(0)} Hz)`,
          },
          {
            title: 'Étape 3 : Facteur de Qualité (Facteur de Surintensité) Q',
            formulaLatex: 'Q = \\frac{1}{R} \\sqrt{\\frac{L}{C}} = \\frac{L \\cdot \\omega_0}{R}',
            explanation: 'Mesure la sélectivité du filtre résonant et l\'amortissement du circuit :',
            intermediateResult: `Q = (1 / ${R}) \\times \\sqrt{${L} / ${C}} = ${Q.toFixed(2)}`,
            pitfallWarning: Q > 10 ? '✓ Facteur de qualité élevé : circuit très sélectif (filtre passe-bande étroit).' : 'ℹ Facteur de qualité modéré : réponse plus amortie et bande passante plus large.',
          },
          {
            title: 'Étape 4 : Bande Passante à -3dB (\\Delta f)',
            formulaLatex: '\\Delta f = \\frac{f_0}{Q} = \\frac{R}{2\\pi \\cdot L}',
            explanation: 'Largeur du spectre en fréquence où la puissance transmise est supérieure à la moitié de la puissance maximale :',
            intermediateResult: `\\Delta f = ${f_0.toFixed(0)} / ${Q.toFixed(2)} = ${(delta_f / 1000).toFixed(2)} kHz (${delta_f.toFixed(0)} Hz)`,
          },
        ],
        finalResult: `Fréquence f_0 = ${(f_0 / 1000).toFixed(2)} kHz | Facteur Q = ${Q.toFixed(2)} | Bande passante = ${(delta_f / 1000).toFixed(2)} kHz`,
        unit: 'kHz / sans unité',
        keyTheorems: ['Lois de Kirchhoff en régime sinusoïdal', 'Théorie des quadripôles et filtres passifs', 'Résonance d\'amplitude de Thomson'],
      };
    },
  },

  // 5. Thermodynamique - Cycle de Carnot & Rendement
  {
    id: 'thermo_carnot_cycle',
    title: 'Thermodynamique : Rendement Maximal du Cycle de Carnot',
    domain: 'Thermodynamique',
    description: 'Application du 2ème principe de la thermodynamique, entropie et calcul du rendement théorique maximal d\'une machine thermique.',
    parameters: [
      { key: 'T_celsius_chaude', label: 'Température Source Chaude (Tc)', unit: '°C', defaultValue: 350 },
      { key: 'T_celsius_froide', label: 'Température Source Froide (Tf)', unit: '°C', defaultValue: 25 },
      { key: 'Q_chaude_kJ', label: 'Chaleur reçue de la source chaude (Qc)', unit: 'kJ', defaultValue: 500 },
    ],
    solve: (p) => {
      const T_C_K = p.T_celsius_chaude + 273.15;
      const T_F_K = p.T_celsius_froide + 273.15;
      const Q_C = p.Q_chaude_kJ;

      const eta_carnot = 1 - (T_F_K / T_C_K);
      const W_utile_max = eta_carnot * Q_C;
      const Q_F_rejetee = Q_C - W_utile_max;

      return {
        problemTitle: `Cycle Moteur de Carnot (T_chaude=${p.T_celsius_chaude}°C, T_froide=${p.T_celsius_froide}°C)`,
        domain: 'Thermodynamique',
        inputsGiven: {
          'Source chaude Tc': `${p.T_celsius_chaude} °C = ${T_C_K.toFixed(2)} K`,
          'Source froide Tf': `${p.T_celsius_froide} °C = ${T_F_K.toFixed(2)} K`,
          'Énergie thermique absorbée Qc': `${Q_C} kJ`,
        },
        hypothesisCheck: [
          '✓ Cycle réversible composé de 2 isothermes et 2 adiabatiques réversibles (isentropiques).',
          '✓ Système fermé fonctionnant avec un gaz parfait sans frottements mécaniques.',
        ],
        steps: [
          {
            title: 'Étape 1 : Conversion des Températures en Kelvins (K)',
            formulaLatex: 'T(K) = T(^\\circ C) + 273.15',
            explanation: 'Les températures thermodynamiques doivent impérativement être exprimées en échelle absolue Kelvin :',
            intermediateResult: `T_C = ${T_C_K.toFixed(2)} K \\quad | \\quad T_F = ${T_F_K.toFixed(2)} K`,
          },
          {
            title: 'Étape 2 : Rendement Théorique Maximal de Carnot \\eta_C',
            formulaLatex: '\\eta_C = 1 - \\frac{T_F}{T_C} = \\frac{T_C - T_F}{T_C}',
            explanation: 'D\'après le théorème de Carnot, aucune machine thermique fonctionnant entre ces deux températures ne peut avoir un rendement supérieur :',
            intermediateResult: `\\eta_C = 1 - (${T_F_K.toFixed(2)} / ${T_C_K.toFixed(2)}) = ${(eta_carnot * 100).toFixed(2)} %`,
          },
          {
            title: 'Étape 3 : Travail Mécanique Utile Maximal Fourni (W_max)',
            formulaLatex: 'W_{\\max} = \\eta_C \\cdot Q_C',
            explanation: 'Conversion maximale de l\'énergie thermique en travail utile :',
            intermediateResult: `W_{max} = ${(eta_carnot).toFixed(4)} \\times ${Q_C} kJ = ${W_utile_max.toFixed(2)} kJ`,
          },
          {
            title: 'Étape 4 : Chaleur Rejetée à la Source Froide (Q_F)',
            formulaLatex: 'Q_F = Q_C - W_{\\max} = Q_C \\cdot \\frac{T_F}{T_C}',
            explanation: 'Quantité d\'énergie thermique obligatoirement dégradée dans l\'environnement selon le 2nd principe de Clausius :',
            intermediateResult: `Q_F = ${Q_C} - ${W_utile_max.toFixed(2)} = ${Q_F_rejetee.toFixed(2)} kJ`,
          },
        ],
        finalResult: `Rendement maximal de Carnot: ${(eta_carnot * 100).toFixed(2)} % | Travail produit: ${W_utile_max.toFixed(2)} kJ | Chaleur rejetée: ${Q_F_rejetee.toFixed(2)} kJ`,
        unit: '% et kJ',
        keyTheorems: ['Second Principe de la Thermodynamique (Inégalité de Clausius)', 'Théorème de Sadi Carnot (1824)', 'Principe de conservation de l\'énergie (1er Principe)'],
      };
    },
  },
];
