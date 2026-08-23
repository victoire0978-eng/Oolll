import React, { useState } from 'react';
import { Message } from '../types';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  KeyRound,
  Sparkles,
  Heart,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Globe,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../utils/speech';

interface ChatMessageProps {
  message: Message;
  onUnlockClick?: () => void;
  onEnrichOnline?: (message: Message) => void;
  isEnriching?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onUnlockClick,
  onEnrichOnline,
  isEnriching = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showExcerpt, setShowExcerpt] = useState(false);
  const [isZoomedImage, setIsZoomedImage] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!isSpeechSynthesisSupported()) return;

    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    speakText(message.content, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const isPrivateLockedResponse =
    (message.content || '').includes('Info privée 🔒') ||
    (message.content || '').includes('mot magique pour débloquer') ||
    (message.content || '').includes('mot de passe secret');

  const isFamilyWelcomeResponse =
    (message.content || '').includes("t'es de la famille maintenant") ||
    (message.content || '').includes('famille maintenant ❤️');

  const timeFormatted = new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const badgeType = message.badge;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex flex-col w-full my-3 px-2 sm:px-3 transition-all ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
        {!isUser && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className={`flex-shrink-0 w-8 h-8 rounded-full border backdrop-blur-md flex items-center justify-center mt-1 shadow-sm ${
              badgeType === 'VERT'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : badgeType === 'ORANGE'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : badgeType === 'ROUGE'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-white/5 border-white/10 text-orange-400'
            }`}
          >
            {badgeType === 'VERT' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : badgeType === 'ORANGE' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : badgeType === 'ROUGE' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-orange-400" />
            )}
          </motion.div>
        )}

        <div className="flex flex-col gap-1 w-full">
          {/* Frosted Glass Bubble */}
          <div
            className={`relative rounded-2xl p-4 text-[15px] leading-relaxed shadow-xl backdrop-blur-md transition-all ${
              isUser
                ? 'bg-orange-500/15 border border-orange-500/35 text-white/95 rounded-tr-none'
                : isFamilyWelcomeResponse
                ? 'bg-gradient-to-br from-rose-500/15 via-white/5 to-purple-500/15 text-white/95 border border-rose-500/40 rounded-tl-none shadow-[0_0_20px_rgba(244,63,94,0.12)]'
                : isPrivateLockedResponse
                ? 'bg-white/5 text-white/90 border border-red-500/35 rounded-tl-none shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                : badgeType === 'VERT'
                ? 'bg-emerald-950/20 text-white/95 border border-emerald-500/30 rounded-tl-none shadow-[0_4px_20px_rgba(16,185,129,0.08)]'
                : badgeType === 'ORANGE'
                ? 'bg-amber-950/20 text-white/95 border border-amber-500/30 rounded-tl-none shadow-[0_4px_20px_rgba(245,158,11,0.08)]'
                : badgeType === 'ROUGE'
                ? 'bg-rose-950/20 text-white/95 border border-rose-500/30 rounded-tl-none shadow-[0_4px_20px_rgba(244,63,94,0.08)]'
                : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
            }`}
          >
            {/* 3-Tier Badge Header for Assistant messages */}
            {!isUser && badgeType && (
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10 text-xs">
                {badgeType === 'VERT' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vérifié dans le cours</span>
                    {message.confidence && (
                      <span className="opacity-75 font-mono text-[11px]">
                        ({Math.round(message.confidence * 100)}%)
                      </span>
                    )}
                  </span>
                )}

                {badgeType === 'ORANGE' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Inférence probable</span>
                    {message.confidence && (
                      <span className="opacity-75 font-mono text-[11px]">
                        ({Math.round(message.confidence * 100)}%)
                      </span>
                    )}
                  </span>
                )}

                {badgeType === 'ROUGE' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Non trouvé dans le cours (&lt; 60%)</span>
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {message.sourceExcerpt && (
                    <button
                      onClick={() => setShowExcerpt(!showExcerpt)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-[11px] font-medium transition active:scale-95"
                    >
                      <FileText className="w-3 h-3 text-orange-400" />
                      <span>{showExcerpt ? 'Masquer extrait' : 'Voir extrait'}</span>
                      {showExcerpt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  {(badgeType === 'ORANGE' || badgeType === 'ROUGE' || message.canEnrichOnline) && onEnrichOnline && (
                    <button
                      onClick={() => onEnrichOnline(message)}
                      disabled={isEnriching}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-[11px] font-bold shadow-md shadow-orange-500/20 transition active:scale-95 disabled:opacity-50"
                    >
                      {isEnriching ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Vérification...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>Repasser en ligne</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Special header if family welcome */}
            {isFamilyWelcomeResponse && (
              <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-rose-500/30 text-rose-300 font-semibold text-xs">
                <Heart className="w-4 h-4 fill-rose-400 text-rose-400 animate-pulse" />
                <span>Accès Famille Autorisé</span>
              </div>
            )}

            {/* Special lock header if private info blocked */}
            {isPrivateLockedResponse && (
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-red-500/20 text-red-400 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span className="uppercase tracking-widest text-[10px]">Action requise</span>
              </div>
            )}

            {/* Source excerpt expandable card */}
            <AnimatePresence>
              {showExcerpt && message.sourceExcerpt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-200/90 text-xs overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5 text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Extrait textuel vérifié du cours :
                    </span>
                    {message.sourcePage && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px]">
                        Page {message.sourcePage}
                      </span>
                    )}
                  </div>
                  <p className="italic leading-relaxed border-l-2 border-emerald-400/50 pl-2.5 text-white/80">
                    "{message.sourceExcerpt}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Markdown content */}
            <div className="markdown-body prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-headings:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-orange-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 text-[14.5px]">
              <Markdown>{message.content}</Markdown>
            </div>

            {/* Extracted Schema / Image Preview */}
            {(message.imageUrl || message.hasImage) && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-orange-300 mb-2 font-medium">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Schéma / Illustration extraite du cours :</span>
                </div>
                {message.imageUrl && (
                  <div className="relative group/img inline-block rounded-xl overflow-hidden border border-white/20 bg-black/50 cursor-pointer max-w-xs">
                    <img
                      src={message.imageUrl}
                      alt="Schéma de cours"
                      className="w-full max-h-48 object-contain hover:scale-105 transition duration-200"
                      onClick={() => setIsZoomedImage(true)}
                    />
                    <div
                      onClick={() => setIsZoomedImage(true)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>Agrandir</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive unlock button if locked notice */}
            {isPrivateLockedResponse && onUnlockClick && (
              <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                <button
                  onClick={onUnlockClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Entrer le mot magique</span>
                </button>
                <span className="text-[11px] text-white/40 italic">Accès privé & confidentiel 🔒</span>
              </div>
            )}
          </div>

          {/* Subtitle / Timestamp & Actions */}
          <div
            className={`flex items-center gap-2 mt-0.5 px-1 ${
              isUser ? 'justify-end' : 'justify-between'
            }`}
          >
            {!isUser && (
              <div className="flex items-center gap-2 text-white/40 text-xs opacity-75 group-hover:opacity-100 transition">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
                  title="Copier le texte"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{copied ? 'Copié' : 'Copier'}</span>
                </button>

                {isSpeechSynthesisSupported() && (
                  <button
                    onClick={handleSpeak}
                    className={`flex items-center gap-1 p-1 rounded-lg hover:bg-white/5 transition ${
                      speaking ? 'text-orange-400 font-semibold animate-pulse' : 'hover:text-white'
                    }`}
                    title={speaking ? 'Arrêter la lecture vocale' : 'Écouter la réponse à haute voix'}
                  >
                    {speaking ? <VolumeX className="w-3.5 h-3.5 text-orange-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{speaking ? 'Stop' : 'Voix'}</span>
                  </button>
                )}
              </div>
            )}

            <span className="text-[10px] text-white/30">
              {isUser ? `Vous • ${timeFormatted}` : `DAKIS AI • ${timeFormatted}`}
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {isZoomedImage && message.imageUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setIsZoomedImage(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[85vh] p-3 rounded-2xl bg-neutral-900 border border-white/20 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-white/80">
                <span className="font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-orange-400" /> Schéma du cours
                </span>
                <button
                  onClick={() => setIsZoomedImage(false)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold"
                >
                  ✕ Fermer
                </button>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center">
                <img
                  src={message.imageUrl}
                  alt="Schéma agrandi"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

