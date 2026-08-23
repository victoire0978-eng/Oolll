import React, { useState } from 'react';
import {
  ACADEMIC_PLAN_TEMPLATES,
  formatCitation,
  generateLatexTemplate,
} from '../utils/academicWriter';
import {
  BibliographyEntry,
  CitationStyle,
} from '../types';
import {
  FileText,
  BookOpen,
  Copy,
  Check,
  Download,
  Sparkles,
  Layers,
  Code,
  CheckCircle2,
} from 'lucide-react';

const SAMPLE_BIBLIOGRAPHY: BibliographyEntry[] = [
  {
    id: 'bib_1',
    type: 'article',
    authors: ['Timoshenko, S.', 'Gere, J. M.'],
    title: 'Theory of Elastic Stability and Structural Mechanics',
    year: 2021,
    publisherOrJournal: 'Journal of Structural Engineering',
    volume: '147(4)',
    pages: '102-118',
    doiOrUrl: '10.1061/(ASCE)ST.1943-541X.0002980',
  },
  {
    id: 'bib_2',
    type: 'book',
    authors: ['Terré, F.', 'Simler, P.', 'Lequette, Y.'],
    title: 'Droit civil : Les obligations',
    year: 2022,
    publisherOrJournal: 'Dalloz Précis',
    volume: '13e éd.',
    pages: '1450',
    doiOrUrl: 'www.dalloz.fr/ouvrages/droit-civil-obligations',
  },
  {
    id: 'bib_3',
    type: 'article',
    authors: ['Fama, E. F.', 'French, K. R.'],
    title: 'Common risk factors in the returns on stocks and bonds',
    year: 2023,
    publisherOrJournal: 'Journal of Financial Economics',
    volume: '33(1)',
    pages: '3-56',
    doiOrUrl: '10.1016/0304-405X(93)90023-5',
  },
];

export const AcademicWriterView: React.FC = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    ACADEMIC_PLAN_TEMPLATES[0].id
  );
  const [subjectTitle, setSubjectTitle] = useState<string>(
    'Optimisation des Structures Mixtes et Analyse de la Résilience Énergétique'
  );
  const [studentName, setStudentName] = useState<string>('Étudiant DAKIS AI');
  const [universityName, setUniversityName] = useState<string>(
    'Université & Faculté Polytechnique'
  );
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA_7');
  const [bibList, setBibList] = useState<BibliographyEntry[]>(SAMPLE_BIBLIOGRAPHY);

  // New Citation input state
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newYear, setNewYear] = useState<string>('2025');
  const [newJournal, setNewJournal] = useState<string>('');

  const [activeSubTab, setActiveSubTab] = useState<'plan' | 'latex' | 'citations'>('plan');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const currentTemplate =
    ACADEMIC_PLAN_TEMPLATES.find((t) => t.id === selectedPlanId) ||
    ACADEMIC_PLAN_TEMPLATES[0];

  const latexCode = generateLatexTemplate(
    currentTemplate,
    subjectTitle,
    studentName,
    universityName
  );

  const handleAddCitation = () => {
    if (!newAuthor.trim() || !newTitle.trim()) return;
    const newEntry: BibliographyEntry = {
      id: 'bib_' + Date.now(),
      type: 'article',
      authors: newAuthor.split(',').map((a) => a.trim()),
      title: newTitle.trim(),
      year: parseInt(newYear) || 2025,
      publisherOrJournal: newJournal.trim() || 'Revue Académique',
    };
    setBibList([newEntry, ...bibList]);
    setNewAuthor('');
    setNewTitle('');
    setNewJournal('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadLatex = () => {
    const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memoire_${selectedPlanId}.tex`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Générateur Universitaire de Rapports & Mémoires
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Normes APA / IEEE / LaTeX
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Structures académiques normées, cadrage de problématiques et mise en conformité des citations bibliographiques.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(latexCode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copié !' : 'Copier'}</span>
            </button>
            <button
              onClick={handleDownloadLatex}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-medium transition-all shadow-lg shadow-purple-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter LaTeX (.tex)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab('plan')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'plan'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Plan & Cadrage Académique</span>
        </button>
        <button
          onClick={() => setActiveSubTab('citations')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'citations'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Générateur de Citations Normées ({bibList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('latex')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'latex'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Code Source LaTeX Prêt à Compiler</span>
        </button>
      </div>

      {/* TAB 1: ACADEMIC PLAN */}
      {activeSubTab === 'plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Config */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Type de Travail Académique
              </h3>

              <div className="space-y-2">
                {ACADEMIC_PLAN_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedPlanId(tmpl.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      selectedPlanId === tmpl.id
                        ? 'bg-purple-500/20 border-purple-500/50 text-white font-semibold'
                        : 'bg-black/30 border-white/10 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-bold">{tmpl.title}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{tmpl.description}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70">Titre du sujet / Problématique :</label>
                  <input
                    type="text"
                    value={subjectTitle}
                    onChange={(e) => setSubjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500/60 text-white text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70">Nom de l'étudiant / Auteur :</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500/60 text-white text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sections View */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-white space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                Plan Structuré & Directives Officielles
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">{currentTemplate.title}</h3>
            </div>

            <div className="space-y-3">
              {currentTemplate.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-purple-300 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {sec.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Poids recommandé : ~{sec.standardPercentage}% du document
                    </span>
                  </div>

                  <div className="text-xs text-white/80 bg-black/20 p-2.5 rounded-xl border border-white/5 space-y-1">
                    <span className="font-semibold text-purple-400">Directives rédactionnelles : </span>
                    <span>{sec.guidelines}</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-white/60">Points clés à développer :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sec.bulletPoints.map((bp, bidx) => (
                        <div key={bidx} className="flex items-center gap-2 text-xs text-white/70 bg-white/5 p-2 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span>{bp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CITATIONS GENERATOR */}
      {activeSubTab === 'citations' && (
        <div className="space-y-6">
          {/* Format selector */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Norme de Citation :</span>
              {(['APA_7', 'IEEE', 'HARVARD', 'ISO_690', 'CHICAGO'] as CitationStyle[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setCitationStyle(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                    citationStyle === st
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                      : 'bg-black/30 text-white/60 border-white/10 hover:bg-white/5'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Add Citation Form */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Ajouter une Référence Bibliographique
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Auteur(s) (ex: Dupont, J., Martin, P.)"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none"
              />
              <input
                type="text"
                placeholder="Titre de l'ouvrage ou de l'article"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none sm:col-span-2"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Année (2025)"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="w-20 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none"
                />
                <button
                  onClick={handleAddCitation}
                  className="flex-1 px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-all shadow-md"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Citations List */}
          <div className="space-y-3">
            {bibList.map((entry) => {
              const formatted = formatCitation(entry, citationStyle);
              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-purple-400 font-mono">
                      {citationStyle.replace('_', ' ')}
                    </span>
                    <div className="text-white/90 leading-relaxed">{formatted}</div>
                  </div>
                  <button
                    onClick={() => handleCopy(formatted)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex-shrink-0 transition-all"
                    title="Copier la citation formatée"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LATEX CODE */}
      {activeSubTab === 'latex' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60 font-mono">
              Fichier LaTeX .tex autonome avec packages mathématiques et chapitrage.
            </span>
            <button
              onClick={() => handleCopy(latexCode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copié !' : 'Copier tout le code'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-black/60 border border-white/10 text-purple-300 font-mono text-xs overflow-x-auto max-h-[500px] scrollbar-thin">
            {latexCode}
          </pre>
        </div>
      )}
    </div>
  );
};
