import { AcademicPlanTemplate, BibliographyEntry, CitationStyle } from '../types';

export const ACADEMIC_PLAN_TEMPLATES: AcademicPlanTemplate[] = [
  {
    id: 'memoire_master',
    type: 'memoire_master',
    title: 'Mémoire Universitaire de Master (Recherche & Professionnel)',
    description: 'Structure académique complète normée pour mémoire de fin d\'études de Master (Bac+5).',
    sections: [
      {
        title: '1. Introduction Générale & Contexte',
        standardPercentage: 10,
        guidelines: 'Présenter le contexte général, l\'accroche, la justification du sujet, la problématique centrale et les objectifs de la recherche.',
        suggestedContent: 'Délimitation du champ d\'étude, formulation de la question de départ, hypothèses préliminaires et annonce du plan.',
        bulletPoints: [
          'Contexte socio-économique ou scientifique',
          'Problématique de recherche explicite',
          'Objectifs de l\'étude et questions secondaires',
          'Structure et articulation globale du mémoire',
        ],
      },
      {
        title: '2. Revue de la Littérature & Cadre Théorique (État de l\'Art)',
        standardPercentage: 25,
        guidelines: 'Synthétiser les travaux scientifiques existants, concepts fondamentaux, modèles théoriques et controverses dans le domaine.',
        suggestedContent: 'Analyse critique des publications récentes, identification du gap scientifique (lacune théorique comblée par le travail).',
        bulletPoints: [
          'Définition des concepts et variables clés',
          'Synthèse des modèles théoriques dominants',
          'Revue critique des études empiriques antérieures',
          'Positionnement épistémologique et hypothèses testables',
        ],
      },
      {
        title: '3. Cadre Méthodologique & Démarche Empirique',
        standardPercentage: 20,
        guidelines: 'Expliciter le protocole expérimental, l\'échantillonnage, la collecte des données et les outils d\'analyse.',
        suggestedContent: 'Méthodes quantitatives (tests statistiques, régressions) ou qualitatives (entretiens semi-directifs, étude de cas).',
        bulletPoints: [
          'Design de recherche (qualitatif, quantitatif ou mixte)',
          'Population d\'étude et critères d\'échantillonnage',
          'Instruments de mesure et protocoles de recueil',
          'Considérations éthiques et limites méthodologiques',
        ],
      },
      {
        title: '4. Présentation des Résultats & Analyse',
        standardPercentage: 25,
        guidelines: 'Exposer les données brutes traitées avec tableaux, graphiques, tests statistiques et synthèses thématiques.',
        suggestedContent: 'Validation ou infirmation des hypothèses initiales avec rigueur et objectivité.',
        bulletPoints: [
          'Statistiques descriptives ou catégorisation thématique',
          'Vérification empirique des hypothèses (p-value, corrélations)',
          'Illustrations graphiques commentées',
          'Synthèse des résultats majeurs',
        ],
      },
      {
        title: '5. Discussion Critique, Apports & Limites',
        standardPercentage: 12,
        guidelines: 'Confronter les résultats obtenus avec la littérature scientifique existante, dégager les contributions théoriques et managériales.',
        suggestedContent: 'Reconnaissance honnête des biais, limites d\'échantillon et recommandations opérationnelles.',
        bulletPoints: [
          'Confrontation avec l\'état de l\'art',
          'Apports théoriques, méthodologiques et pratiques',
          'Biais et limites de validité interne/externe',
          'Perspectives de recherche future',
        ],
      },
      {
        title: '6. Conclusion Générale & Bibliographie Normée',
        standardPercentage: 8,
        guidelines: 'Récapitulatif synthétique de la réponse à la problématique, ouverture et références bibliographiques complètes.',
        suggestedContent: 'Bilan global du projet et conformité stricte aux normes de citation (APA 7e, IEEE ou Harvard).',
        bulletPoints: [
          'Réponse concise et définitive à la problématique',
          'Ouverture vers de nouveaux horizons',
          'Références bibliographiques classées par ordre alphabétique',
          'Annexes numérotées',
        ],
      },
    ],
  },
  {
    id: 'rapport_stage',
    type: 'rapport_stage',
    title: 'Rapport de Stage Professionnel & Projet d\'Ingénieur',
    description: 'Format standardisé pour restitution de stage en entreprise ou projet de fin d\'études (PFE).',
    sections: [
      {
        title: '1. Présentation de l\'Organisme d\'Accueil & Secteur',
        standardPercentage: 15,
        guidelines: 'Historique, organigramme, secteur d\'activité, positionnement concurrentiel et service d\'accueil.',
        suggestedContent: 'Fiche d\'identité de l\'entreprise, missions du département et rôle du tuteur.',
        bulletPoints: ['Fiche d\'identité et organigramme', 'Analyse du marché et concurrents', 'Missions de l\'équipe d\'accueil'],
      },
      {
        title: '2. Expression du Besoin & Cahier des Charges',
        standardPercentage: 20,
        guidelines: 'Problème industriel/managérial à résoudre, contraintes techniques, budgétaires et planning prévisionnel (Gantt).',
        suggestedContent: 'Analyse fonctionnelle (bête à cornes, pieuvre) et objectifs quantifiés du livrable attendu.',
        bulletPoints: ['Diagnostic de la situation existante', 'Cahier des charges fonctionnel', 'Planning et jalons clés (Gantt)'],
      },
      {
        title: '3. Travaux Réalisés, Solutions Techniques & Déploiement',
        standardPercentage: 35,
        guidelines: 'Description détaillée des tâches exécutées, méthodologies appliquées, technologies utilisées et difficultés surmontées.',
        suggestedContent: 'Développement de solution, calculs, tests unitaires, validation et mise en production.',
        bulletPoints: ['Choix techniques et architecture', 'Mise en œuvre concrète des solutions', 'Gestion des imprévus et arbitrages'],
      },
      {
        title: '4. Bilan des Résultats, Retours d\'Expérience & Compétences',
        standardPercentage: 20,
        guidelines: 'Mesure de l\'impact du travail, KPIs de réussite, compétences techniques et relationnelles acquises.',
        suggestedContent: 'Gains pour l\'entreprise (temps, coût, fiabilité) et auto-évaluation professionnelle.',
        bulletPoints: ['Indicateurs de performance (KPIs) atteints', 'Compétences développées (Hard & Soft Skills)', 'Apports pour l\'organisation'],
      },
      {
        title: '5. Conclusion & Remerciements',
        standardPercentage: 10,
        guidelines: 'Synthèse du stage, projection sur le projet professionnel et remerciements protocolaires.',
        suggestedContent: 'Conclusion réflexive et page officielle de remerciements.',
        bulletPoints: ['Bilan global du parcours', 'Projet professionnel futur', 'Remerciements aux encadrants'],
      },
    ],
  },
];

/**
 * Format a bibliography entry according to international citation standards
 */
export function formatCitation(entry: BibliographyEntry, style: CitationStyle): string {
  const authorStr = entry.authors.join(', ');
  const yearStr = entry.year ? `(${entry.year})` : '';

  switch (style) {
    case 'APA_7':
      if (entry.type === 'article') {
        return `${authorStr}. ${yearStr}. ${entry.title}. ${entry.publisherOrJournal ? `*${entry.publisherOrJournal}*` : ''}${entry.volume ? `, ${entry.volume}` : ''}${entry.pages ? `, pp. ${entry.pages}` : ''}.${entry.doiOrUrl ? ` https://doi.org/${entry.doiOrUrl}` : ''}`;
      } else if (entry.type === 'book') {
        return `${authorStr}. ${yearStr}. *${entry.title}*${entry.volume ? ` (Vol. ${entry.volume})` : ''}. ${entry.publisherOrJournal || 'Éditions Universitaires'}.${entry.doiOrUrl ? ` https://doi.org/${entry.doiOrUrl}` : ''}`;
      }
      return `${authorStr}. ${yearStr}. *${entry.title}*. ${entry.publisherOrJournal || ''}.${entry.doiOrUrl ? ` ${entry.doiOrUrl}` : ''}`;

    case 'IEEE':
      const authorsInitial = entry.authors.map((a) => {
        const parts = a.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
        }
        return a;
      }).join(', ');
      return `[1] ${authorsInitial}, "${entry.title}," in *${entry.publisherOrJournal || 'Conf. Proc.'}*${entry.volume ? `, vol. ${entry.volume}` : ''}${entry.pages ? `, pp. ${entry.pages}` : ''}, ${entry.year}.${entry.doiOrUrl ? ` doi: ${entry.doiOrUrl}` : ''}`;

    case 'HARVARD':
      return `${authorStr} ${yearStr} '${entry.title}', *${entry.publisherOrJournal || 'Academic Press'}*${entry.volume ? `, vol. ${entry.volume}` : ''}${entry.pages ? `, pp. ${entry.pages}` : ''}.`;

    case 'ISO_690':
      const upperAuthors = entry.authors.map((a) => a.toUpperCase()).join(', ');
      return `${upperAuthors}. ${entry.title}. ${entry.publisherOrJournal || 'S.l.'}, ${entry.year}${entry.pages ? `, p. ${entry.pages}` : ''}.${entry.doiOrUrl ? ` Disponible sur : <${entry.doiOrUrl}>` : ''}`;

    case 'CHICAGO':
      return `${authorStr}. "${entry.title}." *${entry.publisherOrJournal || 'Journal'}* ${entry.volume || ''} (${entry.year})${entry.pages ? `: ${entry.pages}` : ''}.${entry.doiOrUrl ? ` https://doi.org/${entry.doiOrUrl}` : ''}`;

    default:
      return `${authorStr} (${entry.year}). ${entry.title}. ${entry.publisherOrJournal || ''}`;
  }
}

/**
 * Generate a ready-to-compile LaTeX template of the academic plan
 */
export function generateLatexTemplate(template: AcademicPlanTemplate, subjectTitle: string, studentName: string, universityName: string): string {
  let latex = `\\documentclass[12pt,a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[french]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{hmargin=2.5cm,vmargin=2.5cm}

\\title{\\textbf{${subjectTitle || template.title}}\\\\ \\large ${template.description}}
\\author{${studentName || 'Nom de l\'Étudiant'}}
\\date{\\today}

\\begin{document}

\\maketitle
\\tableofcontents
\\newpage

`;

  for (const sec of template.sections) {
    latex += `\\chapter{${sec.title}}\n`;
    latex += `\\paragraph{Directives :} ${sec.guidelines}\n\n`;
    latex += `\\paragraph{Contenu recommandé :} ${sec.suggestedContent}\n\n`;
    latex += `\\begin{itemize}\n`;
    for (const bp of sec.bulletPoints) {
      latex += `  \\item ${bp}\n`;
    }
    latex += `\\end{itemize}\n\n\\newpage\n\n`;
  }

  latex += `\\begin{thebibliography}{99}
\\bibitem{ref1} Auteur, A. (2025). \\textit{Titre de l'ouvrage fondateur}, Éditions Universitaires.
\\end{thebibliography}

\\end{document}`;

  return latex;
}
