import React, { useState } from 'react';
import {
  STANDARD_LEGAL_CASES,
  generateFicheArret,
} from '../utils/legalStudio';
import {
  LegalSyllogismCase,
  CourtRulingAnalysis,
} from '../types';
import {
  Scale,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const SAMPLE_COURT_RULING: CourtRulingAnalysis = {
  court: 'Cour de cassation, Chambre commerciale',
  date: '27 février 1996',
  jurisdiction: 'Arrêt de cassation (Pourvoi n° 94-11.241)',
  facts: 'Une société commerciale a acquis un matériel industriel informatique dont les performances réelles étaient notablement inférieures à celles promises verbalement lors des négociations précontractuelles.',
  proceduralHistory: 'La Cour d\'appel avait débouté l\'acheteur de son action en nullité au motif qu\'il n\'avait pas fait inscrire les caractéristiques techniques précises dans le corps du contrat écrit.',
  claimsOfParties: {
    appellant: 'L\'acquéreur soutient que la réticence dolosive du vendeur professionnel viciait son consentement dès la phase précontractuelle.',
    respondent: 'Le vendeur soutient que le contrat signé fait la loi des parties et prévaut sur toute déclaration orale préalable.',
  },
  legalProblem: 'Le silence gardé par un professionnel sur un élément déterminant lors des pourparlers peut-il constituer un dol justifiant l\'annulation du contrat ?',
  courtSolution: 'La Cour de cassation casse l\'arrêt d\'appel : la réticence dolosive d\'une partie rend toujours excusable l\'erreur de l\'autre partie, consacrant le devoir précontractuel de loyauté et de bonne foi.',
  doctrineScope: 'Consécration majeure du principe d\'excusabilité de l\'erreur provoquée par dol, codifiée ultérieurement à l\'article 1137 et 1139 du Code civil.',
};

export const LegalStudioView: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    STANDARD_LEGAL_CASES[0].id
  );
  const [activeTab, setActiveTab] = useState<'syllogisme' | 'fiche_arret'>('syllogisme');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const currentCase: LegalSyllogismCase =
    STANDARD_LEGAL_CASES.find((c) => c.id === selectedCaseId) ||
    STANDARD_LEGAL_CASES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getFullSyllogismText = (c: LegalSyllogismCase) => {
    let t = `⚖️ DAKIS AI - Résolution de Cas Pratique Juridique\n\n`;
    t += `Thème : ${c.title} (${c.subjectCategory})\n\n`;
    t += `1. Résumé & Qualification des Faits :\n${c.factsSummary}\n` + c.qualifiedFacts.map((f) => `   - ${f}`).join('\n') + `\n\n`;
    t += `2. Problème de Droit :\n"${c.legalQuestion}"\n\n`;
    t += `3. La Règle de Droit Applicable (Majeure) :\n` + c.majorLegalRule.map((r) => `   * ${r}`).join('\n') + `\n\n`;
    t += `4. Jurisprudence Pertinente :\n` + c.jurisprudenceReferences.map((j) => `   * ${j}`).join('\n') + `\n\n`;
    t += `5. Application d'Espèce aux Faits de la Cause (Mineure) :\n` + c.minorApplication.map((m) => `   * ${m}`).join('\n') + `\n\n`;
    t += `6. Conclusion Juridique :\n${c.conclusion}\n`;
    return t;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Studio Juridique & Méthodologie du Syllogisme
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cas Pratiques & Fiches d'Arrêt
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Démarche rigoureuse du juriste : qualification des faits, problématique, majeure légale, jurisprudence et mineure d'espèce.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activeTab === 'syllogisme' ? getFullSyllogismText(currentCase) : generateFicheArret(SAMPLE_COURT_RULING))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copié !' : 'Copier l\'analyse'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('syllogisme')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'syllogisme'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Cas Pratique & Syllogisme</span>
        </button>
        <button
          onClick={() => setActiveTab('fiche_arret')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'fiche_arret'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Fiche d'Arrêt Méthodologique</span>
        </button>
      </div>

      {/* VIEW 1: SYLLOGISME JURIDIQUE */}
      {activeTab === 'syllogisme' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Cases selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Dossiers & Cas Pratiques
              </h3>
              <div className="space-y-2">
                {STANDARD_LEGAL_CASES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      selectedCaseId === c.id
                        ? 'bg-amber-500/20 border-amber-500/50 text-white font-semibold'
                        : 'bg-black/30 border-white/10 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-bold text-amber-200">{c.title}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{c.subjectCategory}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enoncé initial des faits */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                Énoncé des Faits Bruts
              </span>
              <p className="text-white/80 leading-relaxed italic bg-black/30 p-3 rounded-xl border border-white/5">
                "{currentCase.factsSummary}"
              </p>
            </div>
          </div>

          {/* Right: Step-by-Step Syllogism */}
          <div className="lg:col-span-8 space-y-4">
            {/* 1. Qualification des faits */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">1</span>
                Qualification Juridique des Faits
              </h4>
              <div className="space-y-1.5">
                {currentCase.qualifiedFacts.map((fact, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-white/80 bg-black/20 p-2 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>{fact}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Problème de droit */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">2</span>
                Problème de Droit
              </h4>
              <blockquote className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-amber-200 text-xs font-semibold italic">
                "{currentCase.legalQuestion}"
              </blockquote>
            </div>

            {/* 3. Majeure : Règle de droit & Jurisprudence */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">3</span>
                La Règle de Droit Applicable (Majeure) & Textes
              </h4>
              <div className="space-y-2">
                {currentCase.majorLegalRule.map((rule, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-white/90">
                    {rule}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400">Jurisprudence constante & principes :</span>
                {currentCase.jurisprudenceReferences.map((juri, idx) => (
                  <div key={idx} className="text-xs text-white/70 italic flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{juri}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Mineure : Application aux faits */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">4</span>
                Application d'Espèce aux Faits de la Cause (Mineure)
              </h4>
              <div className="space-y-1.5">
                {currentCase.minorApplication.map((app, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-black/20 text-xs text-white/80 border border-white/5">
                    {app}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Conclusion */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-amber-500/10 to-transparent border border-emerald-500/40 space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                5. Solution & Conclusion Juridique
              </span>
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                {currentCase.conclusion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FICHE D'ARRÊT */}
      {activeTab === 'fiche_arret' && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-mono">
                {SAMPLE_COURT_RULING.jurisdiction}
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {SAMPLE_COURT_RULING.court} — {SAMPLE_COURT_RULING.date}
              </h3>
            </div>
            <button
              onClick={() => handleCopy(generateFicheArret(SAMPLE_COURT_RULING))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copié !' : 'Copier la Fiche'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <h4 className="font-bold text-amber-300">1. Les Faits Qualifiés :</h4>
              <p className="text-white/80 leading-relaxed">{SAMPLE_COURT_RULING.facts}</p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <h4 className="font-bold text-amber-300">2. La Procédure :</h4>
              <p className="text-white/80 leading-relaxed">{SAMPLE_COURT_RULING.proceduralHistory}</p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2 md:col-span-2">
              <h4 className="font-bold text-amber-300">3. Prétentions des Parties :</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <span className="font-semibold text-white/90">Demandeur / Pourvoi : </span>
                  <span className="text-white/70">{SAMPLE_COURT_RULING.claimsOfParties.appellant}</span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <span className="font-semibold text-white/90">Défendeur : </span>
                  <span className="text-white/70">{SAMPLE_COURT_RULING.claimsOfParties.respondent}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-2 md:col-span-2">
              <h4 className="font-bold text-amber-300">4. Le Problème de Droit :</h4>
              <p className="text-white font-semibold italic text-sm">"{SAMPLE_COURT_RULING.legalProblem}"</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 md:col-span-2">
              <h4 className="font-bold text-emerald-300">5. Solution de la Cour & Portée Doctrinale :</h4>
              <p className="text-white/90 leading-relaxed">{SAMPLE_COURT_RULING.courtSolution}</p>
              <div className="pt-2 border-t border-white/10 text-emerald-400/90 text-[11px] font-mono">
                Portée : {SAMPLE_COURT_RULING.doctrineScope}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
