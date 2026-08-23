import React, { useState, useEffect } from 'react';
import {
  MOCK_EXAM_PRESETS,
  evaluateMockExam,
} from '../utils/mockExamEngine';
import {
  MockExamConfig,
  MockExamQuestion,
  MockExamResult,
} from '../types';
import confetti from 'canvas-confetti';
import {
  Award,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Flame,
} from 'lucide-react';

export const MockExamView: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    MOCK_EXAM_PRESETS[0].id
  );
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(30 * 60);
  const [examResult, setExamResult] = useState<MockExamResult | null>(null);

  const currentPreset =
    MOCK_EXAM_PRESETS.find((p) => p.id === selectedPresetId) ||
    MOCK_EXAM_PRESETS[0];

  // Timer Effect
  useEffect(() => {
    let timer: any = null;
    if (isExamStarted && !examResult && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExamStarted, examResult, timeLeftSeconds]);

  const handleStartExam = () => {
    setTimeLeftSeconds(currentPreset.config.durationMinutes * 60);
    setUserAnswers({});
    setCurrentQuestionIdx(0);
    setExamResult(null);
    setIsExamStarted(true);
  };

  const handleSelectAnswer = (qId: number, ans: number | string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: ans }));
  };

  const handleSubmitExam = () => {
    const timeSpent = currentPreset.config.durationMinutes * 60 - timeLeftSeconds;
    const result = evaluateMockExam(currentPreset, userAnswers, timeSpent);
    setExamResult(result);
    setIsExamStarted(false);

    if (result.score >= 10) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = currentPreset.questions[currentQuestionIdx];

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Simulateur d'Examens Blancs Chronométrés
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Notation /20 & Timer Réel
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Conditions officielles d'examen : tirage de questions, chronomètre sans distraction et rapport de compétences détaillé.
              </p>
            </div>
          </div>

          {isExamStarted && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-orange-500/30 font-mono text-xs font-bold text-orange-400">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preset Selector if not started */}
      {!isExamStarted && !examResult && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Sélectionnez votre Épreuve Universitaire
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_EXAM_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  selectedPresetId === preset.id
                    ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-orange-400 font-mono">
                    {preset.config.faculty}
                  </span>
                  <span className="text-xs font-mono text-white/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {preset.config.durationMinutes} min
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">{preset.config.title}</h4>
                <div className="text-xs text-white/50 flex items-center justify-between pt-2 border-t border-white/10">
                  <span>{preset.questions.length} questions clés</span>
                  <span className="font-bold text-orange-300">Sur 20 points</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleStartExam}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-all shadow-xl shadow-orange-500/20 active:scale-95"
            >
              <Flame className="w-4 h-4" />
              <span>Démarrer l'Épreuve Chronométrée ({currentPreset.config.durationMinutes} min)</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE EXAM RUNNER */}
      {isExamStarted && currentQ && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-5">
          {/* Progress Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-400">
                Question {currentQuestionIdx + 1} / {currentPreset.questions.length}
              </span>
              <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
                {currentQ.discipline}
              </span>
            </div>
            <span className="text-xs text-orange-300 font-mono font-bold">
              Barème : {currentQ.points} points
            </span>
          </div>

          {/* Question Text */}
          <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
            {currentQ.question}
          </div>

          {/* Options */}
          {currentQ.type === 'qcm' && currentQ.options && (
            <div className="space-y-2.5">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = userAnswers[currentQ.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectAnswer(currentQ.id, oIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500/50 text-white font-semibold'
                        : 'bg-black/30 border-white/10 text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <span>{opt}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected ? 'border-orange-400 bg-orange-500 text-white' : 'border-white/20'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Précédente</span>
            </button>

            {currentQuestionIdx < currentPreset.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold"
              >
                <span>Suivante</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Terminer & Rendre ma Copie</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* EXAM RESULT VIEW */}
      {examResult && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                Résultat Officiel de l'Épreuve
              </span>
              <h3 className="text-lg font-bold text-white">{currentPreset.config.title}</h3>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-orange-400">
                {examResult.score} / 20
              </div>
              <span className="text-xs text-white/50">Temps : {Math.round(examResult.timeSpentSeconds / 60)} min</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold border ${
            examResult.score >= 10
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}>
            {examResult.generalFeedback}
          </div>

          {/* Question by question detailed corrections */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Corrigé Détaillé</h4>
            {examResult.questionReviews.map((rev, idx) => {
              const q = currentPreset.questions.find((x) => x.id === rev.questionId);
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      {rev.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                      Question {idx + 1} : {q?.question}
                    </span>
                    <span className={`font-mono font-bold ${rev.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      +{rev.pointsAwarded}/{rev.maxPoints} pts
                    </span>
                  </div>

                  <p className="text-white/70 bg-white/5 p-2 rounded-lg leading-relaxed">
                    💡 <span className="font-semibold text-orange-300">Explication :</span> {rev.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setExamResult(null);
                setIsExamStarted(false);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Passer un autre examen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
