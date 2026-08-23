import { MockExamConfig, MockExamQuestion, MockExamResult } from '../types';

export const MOCK_EXAM_PRESETS: { id: string; config: MockExamConfig; questions: MockExamQuestion[] }[] = [
  {
    id: 'exam_polytech_rdm',
    config: {
      faculty: 'Polytechnique & Ingénierie',
      title: 'Épreuve Blanche : RDM & Calcul des Structures (Ingénierie)',
      durationMinutes: 30,
      questionsCount: 5,
      totalPoints: 20,
    },
    questions: [
      {
        id: 1,
        type: 'qcm',
        discipline: 'RDM & Résistance des Matériaux',
        question: 'Quelle est la valeur du moment fléchissant maximal pour une poutre bi-appuyée de portée L soumise à une charge uniforme q ?',
        options: [
          'M_max = (q * L^2) / 8',
          'M_max = (q * L^2) / 2',
          'M_max = (q * L) / 4',
          'M_max = (q * L^3) / 12',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'En intégrant l\'effort tranchant V(x) = qL/2 - qx, le moment atteint son maximum à mi-travée (x = L/2) avec M_max = (q*L^2)/8.',
      },
      {
        id: 2,
        type: 'qcm',
        discipline: 'Béton Armé & Eurocode 2',
        question: 'À l\'État Limite Ultime (ELU), quelle est la valeur du coefficient de sécurité partiel du béton (gamma_c) en situation durable ?',
        options: ['gamma_c = 1.50', 'gamma_c = 1.15', 'gamma_c = 1.35', 'gamma_c = 1.00'],
        correctIndex: 0,
        points: 4,
        explanation: 'Selon l\'Eurocode 2, le coefficient partiel du béton est gamma_c = 1.5 en situation durable et 1.2 en situation accidentelle.',
      },
      {
        id: 3,
        type: 'qcm',
        discipline: 'Stabilité Élastique & Flambement',
        question: 'Quelle est la longueur de flambement L_k d\'un poteau bi-encastré de hauteur géométrique L ?',
        options: ['L_k = 0.5 * L', 'L_k = 0.7 * L', 'L_k = 1.0 * L', 'L_k = 2.0 * L'],
        correctIndex: 0,
        points: 4,
        explanation: 'Pour un poteau parfaitement bi-encastré aux deux extrémités, les points d\'inflexion de la déformée sont à L/4 et 3L/4, d\'où L_k = 0.5*L.',
      },
      {
        id: 4,
        type: 'qcm',
        discipline: 'Mécanique des Milieux Continus',
        question: 'Que représente le cercle de Mohr en résistance des matériaux ?',
        options: [
          'La représentation graphique de l\'état de contrainte (sigma, tau) en un point dans tous les plans possibles',
          'La courbe de traction jusqu\'à la striction',
          'Le diagramme de distribution des températures dans une section',
          'La matrice de rigidité dynamique',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'Le cercle de Mohr projette les contraintes normales et tangentielles sur un repère orthogonal permettant de déterminer directement les contraintes principales et le cisaillement maximal.',
      },
      {
        id: 5,
        type: 'qcm',
        discipline: 'Dynamique des Structures & Vibrations',
        question: 'Quelle est l\'expression de la pulsation propre omega_0 d\'un oscillateur simple masse-ressort (m, k) ?',
        options: [
          'omega_0 = sqrt(k / m)',
          'omega_0 = sqrt(m / k)',
          'omega_0 = k * m',
          'omega_0 = 1 / (2 * pi * sqrt(k*m))',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'L\'équation différentielle m*x\'\' + k*x = 0 conduit directement à omega_0 = sqrt(k/m).',
      },
    ],
  },
  {
    id: 'exam_droit_civil_bac1',
    config: {
      faculty: 'Droit & Sciences Politiques',
      title: 'Épreuve Blanche : Droit Civil & Théorie Générale des Obligations',
      durationMinutes: 30,
      questionsCount: 5,
      totalPoints: 20,
    },
    questions: [
      {
        id: 1,
        type: 'qcm',
        discipline: 'Droit des Contrats',
        question: 'Quelles sont les 3 conditions de validité d\'un contrat selon l\'article 1128 du Code civil ?',
        options: [
          'Le consentement des parties, leur capacité de contracter, un contenu licite et certain',
          'La forme écrite notariée, le paiement immédiat, la présence de témoins',
          'L\'enregistrement fiscal, l\'absence de dette, la nationalité',
          'La bonne foi, l\'absence de rétractation sous 14 jours, le montant fixé',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'L\'article 1128 issu de la réforme de 2016 énumère limitativement : 1° Le consentement des parties ; 2° Leur capacité de contracter ; 3° Un contenu licite et certain.',
      },
      {
        id: 2,
        type: 'qcm',
        discipline: 'Responsabilité Civile',
        question: 'Quels sont les trois éléments cumulatifs indispensables pour engager la responsabilité extracontractuelle (art. 1240 C. civ.) ?',
        options: [
          'Une faute, un dommage certain, un lien de causalité direct',
          'Un contrat signé, un manquement contractuel, une mise en demeure',
          'Un préjudice moral uniquement, une plainte au commissariat, un témoin',
          'Un délit pénal, une amende, une expertise judiciaire',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'La jurisprudence constante exige la preuve conjointe d\'une faute (ou fait générateur), d\'un préjudice direct et certain, et d\'un lien de causalité.',
      },
      {
        id: 3,
        type: 'qcm',
        discipline: 'Vices du Consentement',
        question: 'Quelle est la sanction de principe d\'un contrat conclu sous l\'empire du dol ou de la violence ?',
        options: [
          'La nullité relative du contrat',
          'La nullité absolue d\'ordre public',
          'La résiliation pour l\'avenir uniquement',
          'La caducité automatique sans rétroactivité',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'Les vices du consentement protègent un intérêt privé (la partie dont le consentement a été vicié), ce qui justifie l\'action en nullité relative.',
      },
      {
        id: 4,
        type: 'qcm',
        discipline: 'Droit des Biens',
        question: 'Selon l\'article 544 du Code civil, qu\'est-ce que le droit de propriété ?',
        options: [
          'Le droit de jouir et disposer des choses de la manière la plus absolue, pourvu qu\'on n\'en fasse pas un usage prohibé par les lois ou par les règlements',
          'Une convention temporaire d\'occupation',
          'Un démembrement d\'usufruit réservé aux personnes publiques',
          'Une créance personnelle contre l\'État',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'L\'article 544 consacre les 3 attributs du droit réel par excellence : Usus (usage), Fructus (jouissance des fruits), et Abusus (disposition).',
      },
      {
        id: 5,
        type: 'qcm',
        discipline: 'Introduction Générale au Droit',
        question: 'En droit positif, que postule le principe de non-rétroactivité des lois (art. 2 C. civ.) ?',
        options: [
          'La loi ne dispose que pour l\'avenir ; elle n\'a point d\'effet rétroactif',
          'Une loi nouvelle s\'applique toujours rétroactivement aux procès terminés',
          'Les décrets priment toujours sur la loi constitutionnelle',
          'Les coutumes abrogent les lois promulguées',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'L\'article 2 garantit la sécurité juridique : les actes passés restent régis par la loi en vigueur au jour de leur conclusion.',
      },
    ],
  },
  {
    id: 'exam_eco_finance_gestion',
    config: {
      faculty: 'Sciences Économiques & Gestion',
      title: 'Épreuve Blanche : Analyse Financière & Gestion Stratégique',
      durationMinutes: 30,
      questionsCount: 5,
      totalPoints: 20,
    },
    questions: [
      {
        id: 1,
        type: 'qcm',
        discipline: 'Analyse Financière & Bilan',
        question: 'Comment se calcule la Trésorerie Nette (TN) dans l\'analyse fonctionnelle du bilan ?',
        options: [
          'Trésorerie Nette = FRNG - BFR',
          'Trésorerie Nette = Actif Immobilisé + Stocks',
          'Trésorerie Nette = Capitaux Propres - Dettes à long terme',
          'Trésorerie Nette = Chiffre d\'Affaires / EBE',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'La relation fondamentale d\'équilibre financier stipule que Trésorerie Nette = Fonds de Roulement Net Global (FRNG) - Besoin en Fonds de Roulement (BFR).',
      },
      {
        id: 2,
        type: 'qcm',
        discipline: 'Rentabilité des Investissements',
        question: 'Un projet d\'investissement est financièrement acceptable si sa Valeur Actuelle Nette (VAN) est :',
        options: [
          'Strictement supérieure à 0 (VAN > 0)',
          'Strictement égale à -1',
          'Inférieure au taux d\'inflation',
          'Égale au capital social',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'Une VAN > 0 signifie que la somme actualisée des flux de trésorerie futurs excède le coût initial de l\'investissement au taux de rendement exigé.',
      },
      {
        id: 3,
        type: 'qcm',
        discipline: 'Comptabilité de Gestion & Seuil de Rentabilité',
        question: 'Quelle est la formule du Seuil de Rentabilité (Point Mort en valeur) ?',
        options: [
          'Seuil de Rentabilité = Charges Fixes / Taux de Marge sur Coût Variable',
          'Seuil de Rentabilité = Chiffre d\'Affaires * 1.20',
          'Seuil de Rentabilité = Charges Variables Totales - Amortissements',
          'Seuil de Rentabilité = Capitaux Propres / Dividendes',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'Le seuil de rentabilité correspond au chiffre d\'affaires pour lequel le résultat d\'exploitation est nul : SR = CF / Taux_MCV.',
      },
      {
        id: 4,
        type: 'qcm',
        discipline: 'Stratégie d\'Entreprise',
        question: 'Dans le modèle des 5 forces de Michael Porter, laquelle de ces forces ne figure PAS ?',
        options: [
          'Le taux d\'imposition des sociétés de l\'exercice',
          'L\'intensité de la rivalité entre concurrents existants',
          'La menace des nouveaux entrants',
          'Le pouvoir de négociation des clients',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'Les 5 forces de Porter sont : Rivalité concurrentielle, Nouveaux entrants, Produits de substitution, Pouvoir des clients, et Pouvoir des fournisseurs (la fiscalité relève du modèle PESTEL).',
      },
      {
        id: 5,
        type: 'qcm',
        discipline: 'Microéconomie & Théorie des Marchés',
        question: 'En situation de concurrence pure et parfaite (CPP), quelle condition caractérise l\'équilibre à court terme de la firme maximisant son profit ?',
        options: [
          'Prix (P) = Coût Marginal (Cm)',
          'Prix (P) = Chiffre d\'Affaires Total',
          'Coût Fixe = 0',
          'Marge Commerciale = Coût Moyen Minimal',
        ],
        correctIndex: 0,
        points: 4,
        explanation: 'En CPP, la firme étant preneuse de prix (price taker), la recette marginale est égale au prix P. Le profit est maximal lorsque Recette Marginale = Coût Marginal, soit P = Cm.',
      },
    ],
  },
];

/**
 * Evaluate user exam answers and calculate detailed score /20 and feedbacks
 */
export function evaluateMockExam(
  exam: { config: MockExamConfig; questions: MockExamQuestion[] },
  answers: Record<number, number | string>,
  timeSpentSeconds: number
): MockExamResult {
  let totalScore = 0;
  const questionReviews: MockExamResult['questionReviews'] = [];
  const strongAreas: string[] = [];
  const weakAreas: string[] = [];

  exam.questions.forEach((q) => {
    const userAns = answers[q.id];
    let isCorrect = false;

    if (q.type === 'qcm') {
      isCorrect = userAns !== undefined && Number(userAns) === q.correctIndex;
    } else {
      isCorrect = Boolean(userAns && String(userAns).trim().length > 3);
    }

    const pointsAwarded = isCorrect ? q.points : 0;
    totalScore += pointsAwarded;

    if (isCorrect) {
      if (!strongAreas.includes(q.discipline)) strongAreas.push(q.discipline);
    } else {
      if (!weakAreas.includes(q.discipline)) weakAreas.push(q.discipline);
    }

    questionReviews.push({
      questionId: q.id,
      userAnswer: userAns ?? 'Non répondu',
      isCorrect,
      pointsAwarded,
      maxPoints: q.points,
      explanation: q.explanation,
    });
  });

  const percentage = Math.round((totalScore / exam.config.totalPoints) * 100);
  let status: MockExamResult['status'] = 'failed';
  let generalFeedback = '';

  if (totalScore >= 16) {
    status = 'honors';
    generalFeedback = `🌟 Performance Exceptionnelle (${totalScore}/20) ! Maîtrise parfaite des concepts fondamentaux, des formules et des mécanismes décisionnels.`;
  } else if (totalScore >= 10) {
    status = 'passed';
    generalFeedback = `✓ Épreuve Réussie (${totalScore}/20). Les bases sont validées. Pensez à revoir les quelques notions signalées ci-dessous pour viser la mention.`;
  } else {
    status = 'failed';
    generalFeedback = `⚠️ Résultat Insuffisant (${totalScore}/20). Recommandation : activez le mode révision espacée (Flashcards & Fiches Réflexes) pour consolider les acquis.`;
  }

  return {
    score: totalScore,
    percentage,
    timeSpentSeconds,
    status,
    questionReviews,
    generalFeedback,
    strongAreas,
    weakAreas,
  };
}
