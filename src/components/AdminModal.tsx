import React, { useState, useEffect } from 'react';
import { DakisMemory, SharedCloudCourse, LocalCourse, PdfImage, CourseChunk, AnticipatedQA } from '../types';
import {
  getMemory,
  saveMemory,
  saveKnownPerson,
  removeKnownPerson,
  updatePasswords,
  resetMemory,
  verifyAdminPassword,
} from '../utils/memory';
import {
  fetchOfficialCourses,
  fetchStudentSharedCourses,
  addOfficialCourseByAdmin,
  deleteOrCensorCourse,
  exportOfficialCoursesJson,
  getPublicJsonUrl,
  setPublicJsonUrl,
} from '../utils/publicLibrary';
import {
  getAllLocalCourses,
  getLocalCourseById,
  getCourseChunks,
  getPdfImagesByCourse,
  cleanCourseRejectedMemory,
  scanCourseContradictions,
  exportCourseQAsCsv,
} from '../utils/courseDb';
import {
  Shield,
  KeyRound,
  Trash2,
  Lock,
  Save,
  RotateCcw,
  CheckCircle,
  X,
  Heart,
  Crown,
  Eye,
  EyeOff,
  AlertTriangle,
  BookOpen,
  Plus,
  Link,
  Copy,
  Globe,
  FileText,
  Ban,
  Check,
  Cpu,
  Layers,
  Sparkles,
  Download,
  Search,
  Image as ImageIcon,
  CheckCheck,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryUpdated: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onMemoryUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState<'security' | 'courses' | 'pdfs'>('security');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const [memory, setMemory] = useState<DakisMemory>(getMemory());
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonInfo, setNewPersonInfo] = useState('');

  // Passwords
  const [magicWordInput, setMagicWordInput] = useState('');
  const [queenPasswordInput, setQueenPasswordInput] = useState('');
  const [bossPasswordInput, setBossPasswordInput] = useState('');
  const [showNewPasswords, setShowNewPasswords] = useState(false);

  const [creatorName, setCreatorName] = useState('');
  const [creatorInfo, setCreatorInfo] = useState('');
  const [girlfriendName, setGirlfriendName] = useState('');
  const [girlfriendInfo, setGirlfriendInfo] = useState('');

  // Course Admin Management (Zero-Config)
  const [officialCoursesList, setOfficialCoursesList] = useState<SharedCloudCourse[]>([]);
  const [studentCoursesList, setStudentCoursesList] = useState<SharedCloudCourse[]>([]);
  const [isAddingOfficial, setIsAddingOfficial] = useState(false);
  const [officialTitle, setOfficialTitle] = useState('');
  const [officialFaculty, setOfficialFaculty] = useState('Polytechnique');
  const [officialPdfUrl, setOfficialPdfUrl] = useState('');
  const [officialDescription, setOfficialDescription] = useState('');
  const [customJsonUrlInput, setCustomJsonUrlInput] = useState('');
  const [jsonCopied, setJsonCopied] = useState(false);

  // PDF & Offline Kits Inspector State
  const [localCourses, setLocalCourses] = useState<LocalCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<LocalCourse | null>(null);
  const [selectedImages, setSelectedImages] = useState<PdfImage[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<CourseChunk[]>([]);
  const [pdfInspectorTab, setPdfInspectorTab] = useState<'validees' | 'rejetees' | 'images' | 'chunks'>('validees');
  const [contradictionAlert, setContradictionAlert] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Anti brute force timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (isOpen) {
      const current = getMemory();
      setMemory(current);
      setMagicWordInput('');
      setQueenPasswordInput('');
      setBossPasswordInput('');
      setCreatorName(current.creator.nom);
      setCreatorInfo(current.creator.infos);
      setGirlfriendName(current.girlfriend.nom);
      setGirlfriendInfo(current.girlfriend.infos);
      setCustomJsonUrlInput(getPublicJsonUrl());
      loadCoursesList();
    } else {
      setIsAuthenticated(false);
      setAuthPassword('');
      setShowAuthPassword(false);
      setAuthError(false);
    }
  }, [isOpen]);

  const loadCoursesList = async () => {
    try {
      const officials = await fetchOfficialCourses();
      setOfficialCoursesList(officials);
      const students = fetchStudentSharedCourses();
      setStudentCoursesList(students);
      const locals = await getAllLocalCourses();
      setLocalCourses(locals);
      if (locals.length > 0 && !selectedCourse) {
        handleSelectCourse(locals[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCourse = async (course: LocalCourse) => {
    setSelectedCourse(course);
    setContradictionAlert(null);
    try {
      const [imgs, chks] = await Promise.all([
        getPdfImagesByCourse(course.id),
        getCourseChunks(course.id),
      ]);
      setSelectedImages(imgs);
      setSelectedChunks(chks);
    } catch (err) {
      console.error('Error loading course details:', err);
    }
  };

  const handleScanContradictions = async (courseId: string) => {
    const result = await scanCourseContradictions(courseId);
    if (result.contradictionCount > 0) {
      const questionsList = result.contradictedQAs.map((q) => q.question).slice(0, 3).join(' | ');
      setContradictionAlert(`⚠️ ${result.contradictionCount} contradiction(s) détectée(s) : ${questionsList}`);
      showToast('Attention : Contradictions détectées dans les réponses !');
    } else {
      setContradictionAlert(null);
      showToast('✅ 100% Cohérent : Aucune contradiction trouvée entre les questions.');
    }
  };

  const handleCleanMemory = async (courseId: string) => {
    const count = await cleanCourseRejectedMemory(courseId);
    await loadCoursesList();
    if (selectedCourse && selectedCourse.id === courseId) {
      const updated = await getLocalCourseById(courseId);
      if (updated) setSelectedCourse(updated);
    }
    showToast(`🧹 Nettoyage réussi : ${count} FAQs rejetées supprimées définitivement.`);
  };

  const handleExportCsv = async (courseId: string) => {
    const course = await getLocalCourseById(courseId);
    if (!course) {
      showToast("Impossible d'exporter : cours introuvable");
      return;
    }
    const csvContent = exportCourseQAsCsv(course);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dakis_faqs_${courseId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📥 Export CSV téléchargé avec succès.');
  };

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const trimmed = authPassword.trim();
    if (!trimmed) return;

    if (verifyAdminPassword(trimmed)) {
      setIsAuthenticated(true);
      setAuthError(false);
      setFailedAttempts(0);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setAuthError(true);

      if (nextAttempts >= 5) {
        setLockoutSeconds(30);
      }
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim() || !newPersonInfo.trim()) return;

    const updated = saveKnownPerson(newPersonName.trim(), newPersonInfo.trim());
    setMemory(updated);
    setNewPersonName('');
    setNewPersonInfo('');
    onMemoryUpdated();
    showToast(`Personne "${newPersonName}" ajoutée à la mémoire !`);
  };

  const handleDeletePerson = (name: string) => {
    const updated = removeKnownPerson(name);
    setMemory(updated);
    onMemoryUpdated();
    showToast(`Personne "${name}" supprimée.`);
  };

  const handleUpdatePasswords = (e: React.FormEvent) => {
    e.preventDefault();

    if (!magicWordInput.trim() && !queenPasswordInput.trim() && !bossPasswordInput.trim()) {
      showToast('Aucun nouveau mot de passe saisi.');
      return;
    }

    const updated = updatePasswords(
      magicWordInput.trim() || undefined,
      queenPasswordInput.trim() || undefined,
      bossPasswordInput.trim() || undefined
    );

    setMemory(updated);
    setMagicWordInput('');
    setQueenPasswordInput('');
    setBossPasswordInput('');
    onMemoryUpdated();
    showToast('Mots de passe mis à jour et sécurisés avec SHA-256 !');
  };

  const handleSaveProfiles = () => {
    const updated: DakisMemory = {
      ...memory,
      creator: {
        nom: creatorName.trim() || memory.creator.nom,
        infos: creatorInfo.trim() || memory.creator.infos,
      },
      girlfriend: {
        nom: girlfriendName.trim() || memory.girlfriend.nom,
        infos: girlfriendInfo.trim() || memory.girlfriend.infos,
      },
    };

    saveMemory(updated);
    setMemory(updated);
    onMemoryUpdated();
    showToast('Profils ISMAEL et Daniella mis à jour !');
  };

  const handleResetToDefault = () => {
    if (confirm('Voulez-vous vraiment réinitialiser toute la mémoire DAKIS aux paramètres par défaut ?')) {
      const reset = resetMemory();
      setMemory(reset);
      setCreatorName(reset.creator.nom);
      setCreatorInfo(reset.creator.infos);
      setGirlfriendName(reset.girlfriend.nom);
      setGirlfriendInfo(reset.girlfriend.infos);
      onMemoryUpdated();
      showToast('Mémoire et mots de passe réinitialisés.');
    }
  };

  // Add Official Course by Admin
  const handleAddOfficialCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialTitle.trim() || !officialPdfUrl.trim()) {
      alert('Veuillez renseigner le titre et l’URL directe du PDF.');
      return;
    }

    addOfficialCourseByAdmin({
      title: officialTitle.trim(),
      faculty: officialFaculty,
      downloadUrl: officialPdfUrl.trim(),
      description: officialDescription.trim() || 'Cours officiel validé par Boss ISMAEL',
      totalPages: 25,
    });

    setOfficialTitle('');
    setOfficialPdfUrl('');
    setOfficialDescription('');
    setIsAddingOfficial(false);
    loadCoursesList();
    showToast('Cours officiel ajouté avec succès à la bibliothèque publique !');
  };

  // Censor or Delete a Course
  const handleDeleteCourse = (courseId: string) => {
    if (!confirm('Supprimer / Censurer ce document de la bibliothèque ?')) return;
    deleteOrCensorCourse(courseId);
    loadCoursesList();
    showToast('Document supprimé de la bibliothèque.');
  };

  // Export JSON
  const handleCopyExportJson = async () => {
    const jsonStr = await exportOfficialCoursesJson();
    try {
      await navigator.clipboard.writeText(jsonStr);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 3000);
      showToast('JSON copié dans le presse-papier !');
    } catch (e) {
      alert('Contenu JSON :\n' + jsonStr);
    }
  };

  const handleSaveCustomJsonUrl = () => {
    setPublicJsonUrl(customJsonUrlInput);
    loadCoursesList();
    showToast('URL du catalogue JSON mise à jour !');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#121214]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Espace Administrateur (Boss ISMAEL)
              </h2>
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
                Gestion Système & Bibliothèque Publique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-white/10 bg-white/5">
            <button
              onClick={() => setAdminTab('security')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                adminTab === 'security'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sécurité & Profils</span>
            </button>

            <button
              onClick={() => setAdminTab('courses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                adminTab === 'courses'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Gestion Bibliothèque Publique</span>
            </button>

            <button
              onClick={() => setAdminTab('pdfs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                adminTab === 'pdfs'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kits Offline & Anti-Hallucination</span>
            </button>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in backdrop-blur-md">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!isAuthenticated ? (
            /* Auth screen */
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-purple-400 mb-3 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Authentification Administrateur</h3>
              <p className="text-xs text-white/50 mt-1 max-w-[280px] leading-relaxed">
                Entre le mot de passe Boss ISMAEL (<span className="font-mono text-white/80">bouss2026</span> ou personnalisé).
              </p>

              <form onSubmit={handleAuthenticate} className="w-full max-w-xs mt-5 space-y-3">
                <div className="relative flex items-center">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    autoFocus
                    disabled={lockoutSeconds > 0}
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      setAuthError(false);
                    }}
                    placeholder={lockoutSeconds > 0 ? `Verrouillé (${lockoutSeconds}s)` : 'Mot de passe secret...'}
                    className={`w-full bg-white/5 border rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none backdrop-blur-md transition ${
                      lockoutSeconds > 0
                        ? 'border-rose-500/50 bg-rose-500/5 cursor-not-allowed opacity-70'
                        : 'border-white/10 focus:border-purple-500/60'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    disabled={lockoutSeconds > 0}
                    className="absolute right-3 p-1 text-white/40 hover:text-white/80 transition"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {authError && lockoutSeconds === 0 && (
                  <p className="text-xs text-rose-400 text-left pl-1 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Mot de passe incorrect ({failedAttempts}/5 essais).</span>
                  </p>
                )}

                {lockoutSeconds > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
                    <p className="font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Sécurité Anti-Bruteforce Active
                    </p>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      Trop de tentatives échouées. Réessayez dans <span className="font-bold text-rose-300">{lockoutSeconds} secondes</span>.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95"
                >
                  Déverrouiller l'Admin
                </button>
              </form>
            </div>
          ) : adminTab === 'security' ? (
            /* Tab 1: Security & Profiles */
            <>
              <section className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Mots de Passe Hachés (SHA-256)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewPasswords(!showNewPasswords)}
                    className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition"
                  >
                    {showNewPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showNewPasswords ? 'Masquer' : 'Afficher la saisie'}</span>
                  </button>
                </div>

                <form onSubmit={handleUpdatePasswords} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Mot de passe Boss ISMAEL :
                    </label>
                    <input
                      type={showNewPasswords ? 'text' : 'password'}
                      value={bossPasswordInput}
                      onChange={(e) => setBossPasswordInput(e.target.value)}
                      placeholder="Nouveau mot de passe Boss..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Mot de passe Reine Daniella :
                    </label>
                    <input
                      type={showNewPasswords ? 'text' : 'password'}
                      value={queenPasswordInput}
                      onChange={(e) => setQueenPasswordInput(e.target.value)}
                      placeholder="Nouveau mot de passe Reine..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Mot Magique Famille :
                    </label>
                    <input
                      type={showNewPasswords ? 'text' : 'password'}
                      value={magicWordInput}
                      onChange={(e) => setMagicWordInput(e.target.value)}
                      placeholder="Nouveau mot magique famille..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition active:scale-95 shadow-md"
                  >
                    Enregistrer les Nouveaux Mots de Passe
                  </button>
                </form>
              </section>

              {/* Profiles */}
              <section className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5 fill-rose-400" />
                  <span>Profils Créateur & DAKIS</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Créateur (ISMAEL) :
                    </label>
                    <input
                      type="text"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white mb-1.5 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={creatorInfo}
                      onChange={(e) => setCreatorInfo(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Meuf (Daniella / DAKIS) :
                    </label>
                    <input
                      type="text"
                      value={girlfriendName}
                      onChange={(e) => setGirlfriendName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white mb-1.5 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={girlfriendInfo}
                      onChange={(e) => setGirlfriendInfo(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveProfiles}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-orange-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Mettre à jour les Profils</span>
                  </button>
                </div>
              </section>

              {/* Reset */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-white/40 hover:text-rose-400 p-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser mémoire par défaut</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
                  className="text-white/40 hover:text-white p-1"
                >
                  Verrouiller la session
                </button>
              </div>
            </>
          ) : adminTab === 'courses' ? (
            /* Tab 2: Gestion Bibliothèque Publique (Zero-Config) */
            <div className="space-y-4">
              {/* 1. Add Official PDF via direct URL */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Ajouter un Cours Officiel DAKIS</span>
                  </h4>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Ajoutez un PDF public par lien direct .pdf pour tous les étudiants.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingOfficial(!isAddingOfficial)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingOfficial ? 'Fermer' : 'Ajouter'}</span>
                </button>
              </div>

              {/* Add Official Form */}
              {isAddingOfficial && (
                <form onSubmit={handleAddOfficialCourse} className="p-4 rounded-2xl bg-black/40 border border-amber-500/40 space-y-3">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Link className="w-4 h-4 text-amber-400" />
                    <span>Lien Public du Nouveau Cours</span>
                  </h5>

                  <div>
                    <label className="text-[10.5px] text-white/60 block mb-1">Titre du cours :</label>
                    <input
                      type="text"
                      value={officialTitle}
                      onChange={(e) => setOfficialTitle(e.target.value)}
                      placeholder="Ex: Traité de Béton Armé & Eurocode 2"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] text-white/60 block mb-1">Lien direct URL du PDF (.pdf) :</label>
                    <input
                      type="url"
                      value={officialPdfUrl}
                      onChange={(e) => setOfficialPdfUrl(e.target.value)}
                      placeholder="https://ia800200.us.archive.org/.../cours.pdf"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10.5px] text-white/60 block mb-1">Faculté :</label>
                      <select
                        value={officialFaculty}
                        onChange={(e) => setOfficialFaculty(e.target.value)}
                        className="w-full px-3 py-2 bg-[#18181b] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="Polytechnique">Polytechnique</option>
                        <option value="Droit">Droit</option>
                        <option value="Médecine">Médecine</option>
                        <option value="Économie">Économie</option>
                        <option value="Sciences">Sciences</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] text-white/60 block mb-1">Description courte :</label>
                      <input
                        type="text"
                        value={officialDescription}
                        onChange={(e) => setOfficialDescription(e.target.value)}
                        placeholder="Ex: Formulaire et cours de calcul..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingOfficial(false)}
                      className="px-3 py-1.5 text-xs text-white/50 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md active:scale-95 transition"
                    >
                      Publier dans la Bibliothèque Publique
                    </button>
                  </div>
                </form>
              )}

              {/* 2. Public Catalog Hosting & Export */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Catalogue JSON Public (GitHub / jsDelivr)</span>
                  </h4>
                  <button
                    onClick={handleCopyExportJson}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    {jsonCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{jsonCopied ? 'Copié !' : 'Copier JSON'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-white/50 leading-relaxed">
                  Pour héberger votre catalogue sur GitHub : créez un fichier <span className="font-mono text-white/80">cours.json</span>, collez le contenu JSON ci-dessus, et collez l'URL CDN jsDelivr ci-dessous.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customJsonUrlInput}
                    onChange={(e) => setCustomJsonUrlInput(e.target.value)}
                    placeholder="https://cdn.jsdelivr.net/gh/user/repo/cours.json"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomJsonUrl}
                    className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
                  >
                    Enregistrer URL
                  </button>
                </div>
              </div>

              {/* 3. List of Official and Shared Courses with Censor/Delete button */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center justify-between">
                  <span>Modération des Cours Publics ({officialCoursesList.length + studentCoursesList.length})</span>
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {officialCoursesList.map((course) => (
                    <div
                      key={course.id}
                      className="p-3 rounded-xl bg-black/30 border border-amber-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{course.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Officiel
                          </span>
                        </div>
                        <p className="text-[10.5px] text-white/40 truncate">
                          {course.faculty} • {course.uploaderName}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Censurer / Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {studentCoursesList.map((course) => (
                    <div
                      key={course.id}
                      className="p-3 rounded-xl bg-black/30 border border-purple-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{course.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Étudiant
                          </span>
                        </div>
                        <p className="text-[10.5px] text-white/40 truncate">
                          {course.faculty} • {course.uploaderName}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Censurer / Supprimer"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 3: PDF Offline Kits & Anti-Hallucination Inspector */
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Contrôle Qualité & Anti-Hallucination ({localCourses.length} Cours IndexedDB)</span>
                </div>
                <span className="text-[11px] text-white/50">
                  Vérification mot à mot (verbatim) & embeddings 64D
                </span>
              </div>

              {/* Contradiction Alert if any */}
              {contradictionAlert && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-medium">{contradictionAlert}</span>
                  </div>
                  <button
                    onClick={() => setContradictionAlert(null)}
                    className="p-1 text-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Table of PDF Kits */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-white/5 uppercase text-[10px] font-bold text-white/60 tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3">Titre</th>
                      <th className="p-3">Pages</th>
                      <th className="p-3 text-emerald-400">Validées</th>
                      <th className="p-3 text-rose-400">Rejetées</th>
                      <th className="p-3 text-cyan-400">Images</th>
                      <th className="p-3 text-amber-400">Fiabilité</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {localCourses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-white/40 italic">
                          Aucun cours local indexé. Importez un PDF ou téléchargez un cours depuis la bibliothèque.
                        </td>
                      </tr>
                    ) : (
                      localCourses.map((c) => {
                        const validatedCount = c.anticipatedQA?.length || 0;
                        const rejectedCount = c.rejectedQA?.length || 0;
                        const isSelected = selectedCourse?.id === c.id;
                        const reliability = c.reliabilityScore !== undefined ? `${c.reliabilityScore}%` : '95%';

                        return (
                          <tr
                            key={c.id}
                            onClick={() => handleSelectCourse(c)}
                            className={`cursor-pointer transition hover:bg-white/5 ${
                              isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : ''
                            }`}
                          >
                            <td className="p-3 font-semibold text-white truncate max-w-[140px]">
                              {c.title}
                            </td>
                            <td className="p-3 text-white/60">{c.totalPages || 1}</td>
                            <td className="p-3 font-bold text-emerald-400">
                              {validatedCount}
                            </td>
                            <td className="p-3 font-bold text-rose-400">
                              {rejectedCount}
                            </td>
                            <td className="p-3 text-cyan-300">
                              {c.imagesCount || 0}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {reliability}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectCourse(c);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition"
                              >
                                Inspecter
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Selected Course Inspector */}
              {selectedCourse && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>🔍 Inspecteur :</span>
                        <span className="text-emerald-400">{selectedCourse.title}</span>
                      </h4>
                      <p className="text-[11px] text-white/50">
                        {selectedCourse.faculty} • ID: {selectedCourse.id.slice(0, 12)}...
                      </p>
                    </div>

                    {/* Utility Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleScanContradictions(selectedCourse.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition active:scale-95"
                        title="Vérifier la cohérence globale"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Scanner contradictions</span>
                      </button>

                      <button
                        onClick={() => handleCleanMemory(selectedCourse.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition active:scale-95"
                        title="Supprimer les questions rejetées"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Nettoyer mémoire</span>
                      </button>

                      <button
                        onClick={() => handleExportCsv(selectedCourse.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition active:scale-95"
                        title="Télécharger pour relecture humaine"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Inspector Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 text-xs">
                    <button
                      onClick={() => setPdfInspectorTab('validees')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                        pdfInspectorTab === 'validees'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Validées ({selectedCourse.anticipatedQA?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setPdfInspectorTab('rejetees')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                        pdfInspectorTab === 'rejetees'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Rejetées ({selectedCourse.rejectedQA?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setPdfInspectorTab('images')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                        pdfInspectorTab === 'images'
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Images ({selectedImages.length})</span>
                    </button>

                    <button
                      onClick={() => setPdfInspectorTab('chunks')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                        pdfInspectorTab === 'chunks'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Chunks ({selectedChunks.length})</span>
                    </button>
                  </div>

                  {/* Tab Content 1: Validated FAQs */}
                  {pdfInspectorTab === 'validees' && (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {(!selectedCourse.anticipatedQA || selectedCourse.anticipatedQA.length === 0) ? (
                        <p className="text-xs text-white/40 italic p-3 text-center">
                          Aucune FAQ validée pour ce cours.
                        </p>
                      ) : (
                        selectedCourse.anticipatedQA.map((qa, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 text-white font-bold">
                              <span>❓ {qa.question}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                                Conf: {Math.round((qa.confidence || 0.95) * 100)}%
                              </span>
                            </div>
                            <p className="text-white/80 leading-relaxed pl-3 border-l border-emerald-500/30">
                              {qa.answer}
                            </p>
                            {qa.verbatim && (
                              <div className="mt-1 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200">
                                <span className="font-semibold text-emerald-400">Verbatim extrait (Page {qa.sourcePage || 1}) :</span> "{qa.verbatim}"
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab Content 2: Rejected FAQs */}
                  {pdfInspectorTab === 'rejetees' && (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {(!selectedCourse.rejectedQA || selectedCourse.rejectedQA.length === 0) ? (
                        <p className="text-xs text-emerald-300/80 italic p-3 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                          ✨ Parfait ! Zéro question rejetée (toutes les FAQs sont conformes au texte).
                        </p>
                      ) : (
                        selectedCourse.rejectedQA.map((qa, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-black/40 border border-rose-500/25 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 text-white/90 font-semibold">
                              <span>❌ {qa.question}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                                {qa.rejectionReason}
                              </span>
                            </div>
                            <p className="text-white/60 line-through text-[11px]">
                              {qa.answer}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab Content 3: Images */}
                  {pdfInspectorTab === 'images' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {selectedImages.length === 0 ? (
                        <div className="col-span-2 text-xs text-white/40 italic p-3 text-center">
                          Aucune image ou figure extraite pour ce document.
                        </div>
                      ) : (
                        selectedImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs"
                          >
                            <div className="h-32 bg-black/60 rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
                              <img
                                src={img.imageBase64}
                                alt={`Figure page ${img.pageNumber}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-white/60">
                              <span className="font-bold text-white">Page {img.pageNumber}</span>
                              <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[11px] text-white/80 line-clamp-2">
                              {img.description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab Content 4: Chunks & Embeddings */}
                  {pdfInspectorTab === 'chunks' && (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {selectedChunks.length === 0 ? (
                        <p className="text-xs text-white/40 italic p-3 text-center">
                          Aucun chunk indexé pour ce document.
                        </p>
                      ) : (
                        selectedChunks.map((chk, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-purple-300 font-mono">
                              <span>Chunk #{chk.chunkIndex} (Page {chk.pageNumber})</span>
                              <span>Vector Dim: {chk.embedding?.length || 64}D</span>
                            </div>
                            <p className="text-white/80 text-[11px] line-clamp-3">
                              {chk.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
