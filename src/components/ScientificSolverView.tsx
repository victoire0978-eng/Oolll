import React, { useState } from 'react';
import {
  SCIENTIFIC_SOLVER_TEMPLATES,
  SolvableTemplate,
} from '../utils/scientificSolver';
import {
  Calculator,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';

export const ScientificSolverView: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    SCIENTIFIC_SOLVER_TEMPLATES[0].id
  );
  const [inputs, setInputs] = useState<Record<string, number>>(() => {
    const defaultInputs: Record<string, number> = {};
    SCIENTIFIC_SOLVER_TEMPLATES[0].parameters.forEach((p) => {
      defaultInputs[p.key] = p.defaultValue;
    });
    return defaultInputs;
  });
  const [copiedResult, setCopiedResult] = useState<boolean>(false);

  const currentTemplate: SolvableTemplate =
    SCIENTIFIC_SOLVER_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    SCIENTIFIC_SOLVER_TEMPLATES[0];

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = SCIENTIFIC_SOLVER_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      const newInputs: Record<string, number> = {};
      tmpl.parameters.forEach((p) => {
        newInputs[p.key] = p.defaultValue;
      });
      setInputs(newInputs);
    }
  };

  const handleInputChange = (key: string, val: number) => {
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    const defaultInputs: Record<string, number> = {};
    currentTemplate.parameters.forEach((p) => {
      defaultInputs[p.key] = p.defaultValue;
    });
    setInputs(defaultInputs);
  };

  const solution = currentTemplate.solve(inputs);

  const handleCopy = () => {
    let copyText = `📐 DAKIS AI - Résolution Pas-à-Pas : ${solution.problemTitle}\n\n`;
    copyText += `Domaine : ${solution.domain}\n`;
    copyText += `Données initiales :\n` + Object.entries(solution.inputsGiven).map(([k, v]) => `- ${k}: ${v}`).join('\n') + '\n\n';
    copyText += `Hypothèses & Conditions de validité :\n` + solution.hypothesisCheck.join('\n') + '\n\n';
    copyText += `Étapes de résolution :\n`;
    solution.steps.forEach((s, idx) => {
      copyText += `${idx + 1}. ${s.title}\n   Formule : ${s.formulaLatex || ''}\n   Explication : ${s.explanation}\n   Résultat : ${s.intermediateResult || ''}\n\n`;
    });
    copyText += `🎯 RÉSULTAT FINAL : ${solution.finalResult}\n`;
    copyText += `Théorèmes mobilisés : ${solution.keyTheorems.join(', ')}\n`;

    navigator.clipboard.writeText(copyText);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Solveur Scientifique & Démonstrations Pas-à-Pas
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Calcul Formel
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Résolution analytique détaillée avec théorèmes, hypothèses de validité et détection d'alertes dimensionnelles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all"
            >
              {copiedResult ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedResult ? 'Copié !' : 'Copier la démo'}</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs transition-all"
              title="Réinitialiser les valeurs par défaut"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Model Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {SCIENTIFIC_SOLVER_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleTemplateChange(tmpl.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedTemplateId === tmpl.id
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{tmpl.title}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Paramètres d'Entrée
              </h3>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                {currentTemplate.domain}
              </span>
            </div>

            <p className="text-xs text-white/60">{currentTemplate.description}</p>

            <div className="space-y-3 pt-2">
              {currentTemplate.parameters.map((param) => (
                <div key={param.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium">{param.label}</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {inputs[param.key] ?? param.defaultValue} {param.unit}
                    </span>
                  </div>
                  <input
                    type="number"
                    step={param.step || 0.1}
                    value={inputs[param.key] ?? param.defaultValue}
                    onChange={(e) => handleInputChange(param.key, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-500/60 text-white text-xs font-mono outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Hypotheses check card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" />
              Hypothèses & Conditions de Validité
            </h4>
            <div className="space-y-1.5 text-xs text-white/70">
              {solution.hypothesisCheck.map((hyp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span>{hyp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Step-by-Step Mathematical Demonstration */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Problem Headline */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-white space-y-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Démonstration Analytique Complète
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">{solution.problemTitle}</h3>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {solution.steps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {step.title}
                  </h4>
                </div>

                {step.formulaLatex && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-amber-300 overflow-x-auto">
                    {step.formulaLatex}
                  </div>
                )}

                <p className="text-xs text-white/70 whitespace-pre-line leading-relaxed">
                  {step.explanation}
                </p>

                {step.intermediateResult && (
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs font-mono font-semibold">
                    👉 {step.intermediateResult}
                  </div>
                )}

                {step.pitfallWarning && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{step.pitfallWarning}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Result Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-transparent border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Résultat Final & Synthèse Dimensionnelle
              </span>
              <span className="text-xs text-emerald-300 font-mono font-bold">
                {solution.unit}
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white font-mono">
              {solution.finalResult}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs text-white/60">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white/80">Théorèmes :</span>
              {solution.keyTheorems.map((th, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300 text-[11px]">
                  {th}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
