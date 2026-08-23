import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Search,
  Calculator,
  BrainCircuit,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap,
  X,
  Plus,
  RefreshCw,
  Globe,
  Lock,
  Share2,
  Zap,
  HelpCircle,
  Sigma,
  Eye,
  Crown,
  Link,
  Users,
  ExternalLink,
  BookMarked,
  Filter,
  Volume2,
  VolumeX,
  Copy,
  Check,
  MessageSquareQuote,
  Lightbulb,
  CornerDownRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Scale,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  LocalCourse,
  CourseChunk,
  SharedCloudCourse,
  SearchResultMatch,
  QuizQuestion,
  FormulaReference,
  AnticipatedQA,
  Flashcard,
  ClinicalCase,
  ReflexSheet,
} from '../types';
import {
  getAllLocalCourses,
  saveCourseWithChunks,
  deleteLocalCourse,
  getCourseChunks,
  getAllChunks,
} from '../utils/courseDb';
import { extractPdfContent } from '../utils/pdfExtractor';
import { searchOfflineChunks } from '../utils/offlineSearchEngine';
import { solveOfflineMath, MathCalculationResult, OFFLINE_FORMULA_CATALOG } from '../utils/offlineMathEngine';
import { answerOfflineQuestion, OfflineQAResponse } from '../utils/offlineQAEngine';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../utils/speech';
import {
  generateOffline10PointSummary,
  generateOfflineQuiz,
  extractOfflineFormulas,
  generateOfflineFlashcards,
  generateOfflineClinicalCases,
  generateOfflineReflexSheets,
} from '../utils/offlineStudyTools';
import {
  fetchOfficialCourses,
  searchInternetArchiveBooks,
  fetchStudentSharedCourses,
  shareStudentCourse,
  reportCourse,
  downloadPdfFromUrl,
  InternetArchiveBook,
} from '../utils/publicLibrary';
import {
  analyzeCourseWithGemini,
  fetchInternetArchiveBookRealContent,
} from '../utils/courseAnalyzer';
import { getDeviceId } from '../utils/memory';
import { ScientificSolverView } from './ScientificSolverView';
import { AcademicWriterView } from './AcademicWriterView';
import { LegalStudioView } from './LegalStudioView';
import { FinanceStudioView } from './FinanceStudioView';
import { MockExamView } from './MockExamView';

interface OfflineCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIsmaelBoss?: boolean;
  isDakisQueen?: boolean;
}

type TabType =
  | 'my_courses'
  | 'reader'
  | 'search_math'
  | 'shared_library'
  | 'study_tools'
  | 'scientific_solver'
  | 'academic_writer'
  | 'legal_studio'
  | 'finance_studio'
  | 'mock_exam';
type SharedSubSection = 'official' | 'internet_archive' | 'students';

function highlightSearchMatches(text: string, term: string) {
  if (!term.trim()) return text;
  const parts = text.split(new RegExp(`(${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="bg-amber-400 text-black px-1 rounded font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export const OfflineCoursesModal: React.FC<OfflineCoursesModalProps> = ({
  isOpen,
  onClose,
  isIsmaelBoss,
  isDakisQueen,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('my_courses');
  const [sharedSubSection, setSharedSubSection] = useState<SharedSubSection>('official');

  const [localCourses, setLocalCourses] = useState<LocalCourse[]>([]);
  const [allChunksList, setAllChunksList] = useState<CourseChunk[]>([]);
  const [officialCourses, setOfficialCourses] = useState<SharedCloudCourse[]>([]);
  const [studentCourses, setStudentCourses] = useState<SharedCloudCourse[]>([]);

  // Dedicated PDF & Document Reader State
  const [readingCourseId, setReadingCourseId] = useState<string>('');
  const [readingCourse, setReadingCourse] = useState<LocalCourse | SharedCloudCourse | null>(null);
  const [readingPages, setReadingPages] = useState<{ pageNumber: number; text: string }[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [readerSearchTerm, setReaderSearchTerm] = useState<string>('');
  const [readerViewMode, setReaderViewMode] = useState<'single' | 'continuous'>('single');
  const [isSpeakingPage, setIsSpeakingPage] = useState<boolean>(false);
  const [copiedPageText, setCopiedPageText] = useState<boolean>(false);
  const [pageQuestionInput, setPageQuestionInput] = useState<string>('');
  const [pageQuestionAnswer, setPageQuestionAnswer] = useState<OfflineQAResponse | null>(null);
  const [isAnsweringPageQuestion, setIsAnsweringPageQuestion] = useState<boolean>(false);

  // Internet Archive Books
  const [archiveSearchQuery, setArchiveSearchQuery] = useState<string>('Résistance des matériaux');
  const [archiveBooks, setArchiveBooks] = useState<InternetArchiveBook[]>([]);
  const [isSearchingArchive, setIsSearchingArchive] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');

  // Search & Math & AI QA query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<SearchResultMatch[]>([]);
  const [activeMathResult, setActiveMathResult] = useState<MathCalculationResult | null>(null);
  const [activeQAResponse, setActiveQAResponse] = useState<OfflineQAResponse | null>(null);
  const [speakingQA, setSpeakingQA] = useState<boolean>(false);
  const [copiedQA, setCopiedQA] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Import Modal State (2 choices: Local PDF or Direct URL)
  const [showImportChooser, setShowImportChooser] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'file' | 'url' | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState<string>('');
  const [courseTitleInput, setCourseTitleInput] = useState<string>('');
  const [facultyInput, setFacultyInput] = useState<string>('Polytechnique');
  const [shareWithStudents, setShareWithStudents] = useState<boolean>(false);
  const [courseDescription, setCourseDescription] = useState<string>('');

  // Study Tools state
  const [selectedStudyCourseId, setSelectedStudyCourseId] = useState<string>('');
  const [studyToolView, setStudyToolView] = useState<'flashcards' | 'clinical_cases' | 'reflex_sheets' | 'quiz' | 'summary' | 'formulas' | 'catalog'>('flashcards');
  const [activeSummary, setActiveSummary] = useState<string[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[]>([]);
  const [activeFormulas, setActiveFormulas] = useState<{ formula: string; page: number }[]>([]);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // New Intelligent Study Tools State
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [flashcardMasteredIds, setFlashcardMasteredIds] = useState<Record<string | number, 'easy' | 'medium' | 'hard'>>({});

  const [activeReflexSheets, setActiveReflexSheets] = useState<ReflexSheet[]>([]);
  const [activeClinicalCases, setActiveClinicalCases] = useState<ClinicalCase[]>([]);
  const [revealedCaseIds, setRevealedCaseIds] = useState<Record<string | number, boolean>>({});

  // Universal Formula Catalog State
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(OFFLINE_FORMULA_CATALOG[0]?.id || '');
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>({});
  const [catalogCalcResult, setCatalogCalcResult] = useState<{ result: string | number; unit?: string; steps: string[] } | null>(null);

  // Shared library search & filter
  const [sharedSearchQuery, setSharedSearchQuery] = useState<string>('');
  const [sharedFacultyFilter, setSharedFacultyFilter] = useState<string>('all');
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      performArchiveSearch('Résistance des matériaux');
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const courses = await getAllLocalCourses();
      setLocalCourses(courses);
      const chunks = await getAllChunks();
      setAllChunksList(chunks);

      if (courses.length > 0 && !selectedStudyCourseId) {
        setSelectedStudyCourseId(courses[0].id);
      }

      // Load official & student courses without requiring any API keys
      const officials = await fetchOfficialCourses();
      setOfficialCourses(officials);

      const students = fetchStudentSharedCourses();
      setStudentCourses(students);
    } catch (err) {
      console.error('Error loading offline courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const performArchiveSearch = async (term: string) => {
    if (!term.trim()) return;
    setIsSearchingArchive(true);
    try {
      const results = await searchInternetArchiveBooks(term);
      setArchiveBooks(results);
    } catch (e) {
      console.error('Archive search failed:', e);
    } finally {
      setIsSearchingArchive(false);
    }
  };

  // Open any course or syllabus in the dedicated in-app Document & PDF Reader
  const handleOpenReader = async (courseId: string, targetPage: number = 1) => {
    setIsLoading(true);
    setLoadingStatus('Préparation et ouverture du document...');
    try {
      let foundCourse: LocalCourse | SharedCloudCourse | undefined = localCourses.find((c) => c.id === courseId);
      if (!foundCourse) {
        foundCourse = officialCourses.find((c) => c.id === courseId) || studentCourses.find((c) => c.id === courseId);
      }
      if (!foundCourse) {
        alert('Document introuvable.');
        return;
      }

      setReadingCourseId(courseId);
      setReadingCourse(foundCourse);

      // 1. Check if chunks exist in IndexedDB
      const chunks = await getCourseChunks(courseId);
      let pages: { pageNumber: number; text: string }[] = [];

      if (chunks.length > 0) {
        const pageMap = new Map<number, string[]>();
        chunks.forEach((chunk) => {
          const pNum = chunk.pageNumber || 1;
          if (!pageMap.has(pNum)) pageMap.set(pNum, []);
          pageMap.get(pNum)!.push(chunk.text);
        });

        const sortedPageNums = Array.from(pageMap.keys()).sort((a, b) => a - b);
        pages = sortedPageNums.map((pNum) => ({
          pageNumber: pNum,
          text: pageMap.get(pNum)!.join('\n\n'),
        }));
      }

      // 2. If no chunks in DB (e.g. from public library with raw text), construct pages from fullContent/sampleText/description
      if (pages.length === 0) {
        const rawText = foundCourse.fullContent || (foundCourse as any).sampleText || foundCourse.description || '';
        if (rawText.includes('--- Page ')) {
          const splitPages = rawText.split(/--- Page \d+ ---/g).filter(Boolean);
          pages = splitPages.map((pText, idx) => ({
            pageNumber: idx + 1,
            text: pText.trim(),
          }));
        } else if (rawText.trim().length > 0) {
          const paras = rawText.split('\n\n').filter((p: string) => p.trim());
          if (paras.length <= 3) {
            pages = [{ pageNumber: 1, text: rawText.trim() }];
          } else {
            const chunkedPages: { pageNumber: number; text: string }[] = [];
            let currentAccum = '';
            let pIdx = 1;
            for (const para of paras) {
              if ((currentAccum + para).length > 1000 && currentAccum.length > 0) {
                chunkedPages.push({ pageNumber: pIdx++, text: currentAccum.trim() });
                currentAccum = para + '\n\n';
              } else {
                currentAccum += para + '\n\n';
              }
            }
            if (currentAccum.trim()) {
              chunkedPages.push({ pageNumber: pIdx, text: currentAccum.trim() });
            }
            pages = chunkedPages;
          }
        } else {
          pages = [{
            pageNumber: 1,
            text: `# ${foundCourse.title}\n\n**Faculté : ${foundCourse.faculty}**\n\nCe cours est prêt pour l'étude et les calculs hors-ligne. Vous pouvez poser vos questions sur ce sujet via le panneau IA ci-dessous ou lancer un résumé / quiz.`,
          }];
        }
      }

      setReadingPages(pages);
      const validPage = Math.min(Math.max(1, targetPage), pages.length || 1);
      setCurrentPageNumber(validPage);
      setPageQuestionAnswer(null);
      setPageQuestionInput('');
      setReaderSearchTerm('');
      setActiveTab('reader');
    } catch (err) {
      console.error('Error opening reader:', err);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Audio voice reading of the currently displayed page
  const handleToggleSpeakPage = () => {
    if (!isSpeechSynthesisSupported()) return;
    if (isSpeakingPage) {
      stopSpeaking();
      setIsSpeakingPage(false);
      return;
    }
    const currentPageData = readingPages.find((p) => p.pageNumber === currentPageNumber);
    if (!currentPageData || !currentPageData.text) return;

    setIsSpeakingPage(true);
    speakText(currentPageData.text, {
      onStart: () => setIsSpeakingPage(true),
      onEnd: () => setIsSpeakingPage(false),
      onError: () => setIsSpeakingPage(false),
    });
  };

  // Ask an instant offline AI question specifically regarding the current document or page
  const handleAskPageQuestion = (customQuestion?: string) => {
    const query = (customQuestion || pageQuestionInput).trim();
    if (!query) return;

    setIsAnsweringPageQuestion(true);
    const currentPageData = readingPages.find((p) => p.pageNumber === currentPageNumber);
    const pageContextChunk: CourseChunk = {
      id: 999999,
      courseId: readingCourseId,
      courseTitle: readingCourse?.title || 'Cours',
      pageNumber: currentPageNumber,
      chunkIndex: 0,
      text: currentPageData?.text || '',
    };

    const contextChunks = [pageContextChunk, ...allChunksList.filter((c) => c.courseId === readingCourseId)];

    const response = answerOfflineQuestion(query, {
      chunks: contextChunks,
      localCourses,
      isBoss: isIsmaelBoss,
      isQueen: isDakisQueen,
    });

    setPageQuestionAnswer(response);
    setIsAnsweringPageQuestion(false);
  };

  // Perform instant offline AI Q&A answering, semantic search & math calculations
  const handlePerformSearch = (queryText: string) => {
    setSearchQuery(queryText);
    const clean = queryText.trim();
    if (!clean) {
      setSearchResults([]);
      setActiveMathResult(null);
      setActiveQAResponse(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const courseFilter = selectedCourseFilter === 'all' ? undefined : selectedCourseFilter;
    const filterChunks = courseFilter ? allChunksList.filter((c) => c.courseId === courseFilter) : allChunksList;

    // 1. Solve Offline Q&A (Synthesis + Math + Knowledge Graph + Course Chunks)
    const qaResponse = answerOfflineQuestion(clean, {
      chunks: filterChunks,
      localCourses,
      isBoss: isIsmaelBoss,
      isQueen: isDakisQueen,
    });
    setActiveQAResponse(qaResponse);

    // 2. Perform exact chunk search
    const { matches, mathResult } = searchOfflineChunks(clean, allChunksList, courseFilter);
    setSearchResults(qaResponse.sourceMatches && qaResponse.sourceMatches.length > 0 ? qaResponse.sourceMatches : matches);
    setActiveMathResult(qaResponse.mathResult || mathResult);
  };

  const handleToggleSpeakQA = (textToSpeak: string) => {
    if (!isSpeechSynthesisSupported()) return;
    if (speakingQA) {
      stopSpeaking();
      setSpeakingQA(false);
      return;
    }
    setSpeakingQA(true);
    speakText(textToSpeak, {
      onStart: () => setSpeakingQA(true),
      onEnd: () => setSpeakingQA(false),
      onError: () => setSpeakingQA(false),
    });
  };

  const handleCopyQA = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedQA(true);
    setTimeout(() => setCopiedQA(false), 2000);
  };

  // Handle PDF file selection from phone or PC
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier au format .PDF');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('Le fichier dépasse la limite autorisée de 25 Mo.');
      return;
    }

    setUploadFile(file);
    setCourseTitleInput(file.name.replace(/\.pdf$/i, ''));
    setImportMode('file');
    setShowImportChooser(false);
  };

  // Save imported PDF (from File or from URL)
  const handleSaveImport = async () => {
    setIsLoading(true);
    setLoadingStatus('Extraction du texte et indexation sémantique...');

    try {
      let pdfBuffer: ArrayBuffer;
      let title = courseTitleInput.trim();

      if (importMode === 'file') {
        if (!uploadFile) throw new Error('Aucun fichier sélectionné.');
        pdfBuffer = await uploadFile.arrayBuffer();
        if (!title) title = uploadFile.name.replace(/\.pdf$/i, '');
      } else {
        if (!importUrl.trim()) throw new Error('Veuillez renseigner une URL valide.');
        setLoadingStatus(`Téléchargement depuis l'URL...`);
        pdfBuffer = await downloadPdfFromUrl(importUrl.trim(), title || 'Cours Web');
        if (!title) title = 'Cours Web Téléchargé';
      }

      const courseId = 'course_' + Date.now();
      const extracted = await extractPdfContent(
        pdfBuffer,
        title,
        courseId,
        facultyInput
      );

      const newLocalCourse: LocalCourse = {
        id: courseId,
        title: title || extracted.title,
        faculty: facultyInput,
        totalPages: extracted.totalPages,
        fileSize: extracted.fileSize,
        createdAt: Date.now(),
        summary: extracted.summaryPoints,
        formulas: extracted.formulas,
        isOfficial: isIsmaelBoss,
        sharedOnline: shareWithStudents,
      };

      // 1. Save to local IndexedDB (100% offline)
      await saveCourseWithChunks(newLocalCourse, extracted.chunks);

      // 2. If student wants to share with peers
      if (shareWithStudents) {
        const uploaderId = getDeviceId();
        const uploaderName = isIsmaelBoss
          ? 'Boss ISMAEL (Créateur) ⚡'
          : isDakisQueen
          ? 'Reine Daniella (DAKIS) 👑'
          : 'Étudiant DAKIS';

        shareStudentCourse({
          title: newLocalCourse.title,
          faculty: newLocalCourse.faculty,
          totalPages: newLocalCourse.totalPages,
          fileSize: newLocalCourse.fileSize,
          createdAt: Date.now(),
          uploaderId,
          uploaderName,
          isOfficial: !!isIsmaelBoss,
          description: courseDescription || `Cours partagé de ${facultyInput}`,
        });
      }

      await loadInitialData();
      setImportMode(null);
      setUploadFile(null);
      setImportUrl('');
      setCourseTitleInput('');
      setCourseDescription('');
      setActiveTab('my_courses');
    } catch (err: any) {
      console.error('Import error:', err);
      alert("Erreur lors de l'importation : " + (err.message || 'Impossible d’extraire le document'));
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Delete a local course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce cours de votre mémoire locale ?')) return;
    try {
      await deleteLocalCourse(courseId);
      await loadInitialData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Download a course from Public Library into local IndexedDB for airplane mode
  const handleDownloadPublicCourse = async (course: SharedCloudCourse) => {
    setIsLoading(true);
    setLoadingStatus(`Téléchargement de "${course.title}" pour le mode avion...`);

    try {
      const contentToUse =
        course.fullContent ||
        course.sampleText ||
        `Cours : ${course.title}\nFaculté : ${course.faculty}\n${course.description || ''}`;

      let pdfBuffer: ArrayBuffer;

      if (course.downloadUrl) {
        pdfBuffer = await downloadPdfFromUrl(course.downloadUrl, course.title, contentToUse);
      } else {
        pdfBuffer = new TextEncoder().encode(contentToUse).buffer;
      }

      const extracted = await extractPdfContent(
        pdfBuffer,
        course.title,
        course.id,
        course.faculty
      );

      const localCourse: LocalCourse = {
        id: course.id,
        title: course.title,
        faculty: course.faculty,
        totalPages: course.totalPages || extracted.totalPages,
        fileSize: course.fileSize || extracted.fileSize,
        createdAt: Date.now(),
        fullContent: course.fullContent || extracted.fullText,
        summary: (course.summary && course.summary.length > 0) ? course.summary : extracted.summaryPoints,
        formulas: (course.formulas && course.formulas.length > 0)
          ? Array.from(new Set([...course.formulas, ...extracted.formulas]))
          : extracted.formulas,
        quiz: course.quiz,
        isOfficial: course.isOfficial,
        sharedOnline: true,
      };

      await saveCourseWithChunks(localCourse, extracted.chunks);
      await loadInitialData();
      alert(`"${course.title}" est maintenant disponible 100% hors-ligne en mode avion !`);
      setActiveTab('my_courses');
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Impossible de télécharger ce cours : ' + err.message);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Download Internet Archive book directly to offline IndexedDB
  const handleDownloadArchiveBook = async (book: InternetArchiveBook) => {
    setIsLoading(true);
    setLoadingStatus(`Téléchargement du livre "${book.title}" depuis Internet Archive...`);

    try {
      const pdfBuffer = await downloadPdfFromUrl(book.pdfUrl, book.title, book.description);
      const courseId = 'archive_' + book.identifier;

      const extracted = await extractPdfContent(
        pdfBuffer,
        book.title,
        courseId,
        'Sciences & Bibliothèque'
      );

      const localCourse: LocalCourse = {
        id: courseId,
        title: book.title,
        faculty: 'Sciences & Bibliothèque',
        totalPages: extracted.totalPages,
        fileSize: extracted.fileSize,
        createdAt: Date.now(),
        summary: extracted.summaryPoints,
        formulas: extracted.formulas,
        isOfficial: false,
        sharedOnline: true,
      };

      await saveCourseWithChunks(localCourse, extracted.chunks);
      await loadInitialData();
      alert(`Le livre "${book.title}" a été indexé avec succès en 100% hors-ligne !`);
      setActiveTab('my_courses');
    } catch (err: any) {
      console.error('Archive book download error:', err);
      alert('Erreur lors du téléchargement : ' + err.message);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Report a shared course
  const handleReportCourse = (courseId: string) => {
    if (reportedIds.includes(courseId)) {
      alert('Vous avez déjà signalé ce document.');
      return;
    }
    if (!confirm('Signaler ce cours pour contenu inapproprié ?')) return;

    const count = reportCourse(courseId);
    setReportedIds((prev) => [...prev, courseId]);
    alert(`Signalement enregistré (${count}/3).`);
    loadInitialData();
  };

  // Run study tools on selected course
  const handleRunStudyTool = async (
    courseId: string,
    toolType: 'flashcards' | 'clinical_cases' | 'reflex_sheets' | 'summary' | 'quiz' | 'formulas' | 'catalog'
  ) => {
    setSelectedStudyCourseId(courseId);
    setStudyToolView(toolType);
    setActiveTab('study_tools');

    if (toolType === 'catalog') {
      const defaultF = OFFLINE_FORMULA_CATALOG[0];
      if (defaultF) {
        setSelectedFormulaId(defaultF.id);
        const defaults: Record<string, number> = {};
        defaultF.variables.forEach((v) => {
          defaults[v.symbol] = v.defaultValue ?? 0;
        });
        setFormulaInputs(defaults);
        setCatalogCalcResult(defaultF.calculate(defaults));
      }
      return;
    }

    const currentCourse = localCourses.find((c) => c.id === courseId);
    const chunks = await getCourseChunks(courseId);
    const courseTitle = currentCourse?.title || 'Cours';

    if (toolType === 'flashcards') {
      if (currentCourse?.flashcards && currentCourse.flashcards.length > 0) {
        setActiveFlashcards(currentCourse.flashcards);
      } else {
        const fc = generateOfflineFlashcards(chunks, courseTitle);
        setActiveFlashcards(fc);
      }
      setCurrentFlashcardIdx(0);
      setIsCardFlipped(false);
    } else if (toolType === 'clinical_cases') {
      if (currentCourse?.clinicalCases && currentCourse.clinicalCases.length > 0) {
        setActiveClinicalCases(currentCourse.clinicalCases);
      } else {
        const cc = generateOfflineClinicalCases(chunks, courseTitle);
        setActiveClinicalCases(cc);
      }
    } else if (toolType === 'reflex_sheets') {
      if (currentCourse?.reflexSheets && currentCourse.reflexSheets.length > 0) {
        setActiveReflexSheets(currentCourse.reflexSheets);
      } else {
        const rs = generateOfflineReflexSheets(chunks, courseTitle);
        setActiveReflexSheets(rs);
      }
    } else if (toolType === 'summary') {
      if (currentCourse?.summary && currentCourse.summary.length > 0) {
        setActiveSummary(currentCourse.summary);
      } else {
        const summary = generateOffline10PointSummary(chunks);
        setActiveSummary(summary);
      }
    } else if (toolType === 'quiz') {
      if (currentCourse?.quiz && currentCourse.quiz.length > 0) {
        setActiveQuiz(currentCourse.quiz);
      } else {
        const quiz = generateOfflineQuiz(chunks);
        setActiveQuiz(quiz);
      }
      setQuizUserAnswers({});
      setQuizScore(null);
    } else if (toolType === 'formulas') {
      const fromCourse = (currentCourse?.formulas || []).map((f) => ({ formula: f, page: 1 }));
      const extracted = extractOfflineFormulas(chunks);
      const combined = [...fromCourse, ...extracted];
      const seen = new Set<string>();
      const unique = combined.filter((item) => {
        if (seen.has(item.formula)) return false;
        seen.add(item.formula);
        return true;
      });
      setActiveFormulas(
        unique.length > 0
          ? unique
          : [{ formula: 'Consultez les extraits du cours pour les formules détaillées.', page: 1 }]
      );
    }
  };

  // Handle formula selection in catalog
  const handleSelectCatalogFormula = (formula: FormulaReference) => {
    setSelectedFormulaId(formula.id);
    const defaults: Record<string, number> = {};
    formula.variables.forEach((v) => {
      defaults[v.symbol] = v.defaultValue ?? 0;
    });
    setFormulaInputs(defaults);
    setCatalogCalcResult(formula.calculate(defaults));
  };

  // Handle variable input change
  const handleFormulaInputChange = (symbol: string, valStr: string) => {
    const val = parseFloat(valStr);
    const updated = { ...formulaInputs, [symbol]: isNaN(val) ? 0 : val };
    setFormulaInputs(updated);

    const f = OFFLINE_FORMULA_CATALOG.find((item) => item.id === selectedFormulaId);
    if (f) {
      setCatalogCalcResult(f.calculate(updated));
    }
  };

  // Handle quiz option select
  const handleQuizAnswer = (qId: number, optionIdx: number) => {
    if (quizScore !== null) return;
    setQuizUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  // Submit Quiz
  const handleSubmitQuiz = () => {
    let score = 0;
    activeQuiz.forEach((q) => {
      if (quizUserAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden">
        {/* Top Header & Navigation */}
        <div className="flex flex-col border-b border-white/10 bg-white/5 backdrop-blur-xl">
          {/* Main Title Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Mes Cours & Bibliothèque Publique
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    🟢 100% Mode Avion
                  </span>
                </h2>
                <p className="text-[11px] text-white/50">
                  {localCourses.length} cours en local • Recherche sémantique • Moteur mathématique • Livres libres
                </p>
              </div>
            </div>

            {/* Plus / Import Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportChooser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un cours</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setActiveTab('my_courses')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'my_courses'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mes Cours ({localCourses.length})</span>
            </button>

            <button
              onClick={() => {
                if (localCourses.length > 0 && !readingCourse) {
                  handleOpenReader(localCourses[0].id, 1);
                } else {
                  setActiveTab('reader');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'reader'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {readingCourse ? `Lecteur (${readingCourse.title.slice(0, 14)}...) 📖` : 'Lecteur PDF 📖'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('search_math')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'search_math'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Questions & Calculs IA 💬</span>
            </button>

            <button
              onClick={() => setActiveTab('shared_library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'shared_library'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Bibliothèque Commune 🌍</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('study_tools');
                if (localCourses.length > 0 && !selectedStudyCourseId) {
                  handleRunStudyTool(localCourses[0].id, 'summary');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'study_tools'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-rose-400" />
              <span>Outils d'Étude & SM-2 🧠</span>
            </button>

            <button
              onClick={() => setActiveTab('scientific_solver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'scientific_solver'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Solveur Scientifique 📐</span>
            </button>

            <button
              onClick={() => setActiveTab('academic_writer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'academic_writer'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Rédacteur Mémoires 📑</span>
            </button>

            <button
              onClick={() => setActiveTab('legal_studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'legal_studio'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Studio Juridique ⚖️</span>
            </button>

            <button
              onClick={() => setActiveTab('finance_studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'finance_studio'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Éco & Finance 📊</span>
            </button>

            <button
              onClick={() => setActiveTab('mock_exam')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'mock_exam'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-orange-400" />
              <span>Examens Blancs 🏆</span>
            </button>
          </div>
        </div>

        {/* Global Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-white/90">{loadingStatus || 'Chargement en cours...'}</p>
          </div>
        )}

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: MES COURS OFFLINE */}
          {activeTab === 'my_courses' && (
            <div className="space-y-4">
              {localCourses.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/20 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Aucun cours dans votre stockage local</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
                      Importez un PDF depuis votre appareil, collez un lien URL ou explorez la Bibliothèque Commune 🌍 pour télécharger des cours prêts à l'emploi.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setShowImportChooser(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un cours</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('shared_library')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition active:scale-95"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Explorer la Bibliothèque Commune</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {localCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              <FileText className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
                                {course.title}
                              </h4>
                              <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/10">
                                {course.faculty}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Supprimer ce cours du stockage local"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-white/40 pt-1">
                          <span>📄 {course.totalPages} pages</span>
                          <span>💾 {(course.fileSize / 1024).toFixed(0)} Ko</span>
                          <span>📅 {new Date(course.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action quick buttons */}
                      <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => handleOpenReader(course.id, 1)}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-[11px] font-bold transition active:scale-95 shadow-sm"
                          title="Lire ce document page par page"
                        >
                          <BookOpen className="w-3 h-3 text-orange-400" />
                          <span>Lire 📖</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCourseFilter(course.id);
                            setActiveTab('search_math');
                          }}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 text-[11px] font-medium transition"
                        >
                          <Search className="w-3 h-3 text-cyan-400" />
                          <span>Chercher</span>
                        </button>

                        <button
                          onClick={() => handleRunStudyTool(course.id, 'summary')}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 text-[11px] font-medium transition"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span>Résumé</span>
                        </button>

                        <button
                          onClick={() => handleRunStudyTool(course.id, 'quiz')}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 text-[11px] font-medium transition"
                        >
                          <BrainCircuit className="w-3 h-3 text-rose-400" />
                          <span>Quiz</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: LECTEUR PDF & DOCUMENTS INTERACTIF */}
          {activeTab === 'reader' && (
            <div className="space-y-4">
              {!readingCourse ? (
                <div className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/20 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Sélectionnez un cours ou document à lire</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
                      Choisissez l'un de vos cours pour l'ouvrir dans le lecteur interactif page par page avec synthèse vocale et assistant IA hors-ligne intégré.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {localCourses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleOpenReader(c.id, 1)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 text-white font-medium text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-orange-400" />
                        <span>{c.title}</span>
                      </button>
                    ))}
                    {localCourses.length === 0 && (
                      <button
                        onClick={() => setShowImportChooser(true)}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition"
                      >
                        Importer un premier PDF
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Bar of Reader */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab('my_courses')}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                        title="Retour à la liste des cours"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Mes cours</span>
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white max-w-[220px] sm:max-w-xs md:max-w-md truncate">
                            {readingCourse.title}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                            {readingCourse.faculty}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/40">
                          {readingPages.length} {readingPages.length > 1 ? 'pages disponibles' : 'page disponible'} • Mode 100% Hors-Ligne
                        </p>
                      </div>
                    </div>

                    {/* Controls: Mode, Font Size, Audio */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Mode Toggle */}
                      <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                        <button
                          onClick={() => setReaderViewMode('single')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition ${
                            readerViewMode === 'single'
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Page par page
                        </button>
                        <button
                          onClick={() => setReaderViewMode('continuous')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition ${
                            readerViewMode === 'continuous'
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Défilement continu
                        </button>
                      </div>

                      {/* Font Size Selector */}
                      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                        <button
                          onClick={() => {
                            const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
                            const curIdx = sizes.indexOf(readerFontSize);
                            if (curIdx > 0) setReaderFontSize(sizes[curIdx - 1]);
                          }}
                          disabled={readerFontSize === 'sm'}
                          className="p-1 rounded-lg text-white/60 hover:text-white disabled:opacity-30"
                          title="Diminuer la police"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-white/50 px-1 font-mono uppercase">
                          {readerFontSize}
                        </span>
                        <button
                          onClick={() => {
                            const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
                            const curIdx = sizes.indexOf(readerFontSize);
                            if (curIdx < sizes.length - 1) setReaderFontSize(sizes[curIdx + 1]);
                          }}
                          disabled={readerFontSize === 'xl'}
                          className="p-1 rounded-lg text-white/60 hover:text-white disabled:opacity-30"
                          title="Agrandir la police"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Audio Voice Read Button */}
                      <button
                        onClick={handleToggleSpeakPage}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          isSpeakingPage
                            ? 'bg-amber-500 text-black animate-pulse shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                        }`}
                        title="Écouter la lecture vocale de cette page"
                      >
                        {isSpeakingPage ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{isSpeakingPage ? 'Arrêter' : 'Écouter'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Page Navigation & Search (Single-page mode) */}
                  {readerViewMode === 'single' && readingPages.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            stopSpeaking();
                            setIsSpeakingPage(false);
                            setCurrentPageNumber((p) => Math.max(1, p - 1));
                          }}
                          disabled={currentPageNumber <= 1}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold disabled:opacity-30 transition border border-white/10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Précédent</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium px-2">
                          <span>Page</span>
                          <select
                            value={currentPageNumber}
                            onChange={(e) => {
                              stopSpeaking();
                              setIsSpeakingPage(false);
                              setCurrentPageNumber(Number(e.target.value));
                            }}
                            className="bg-black/60 border border-white/20 rounded-md px-2 py-1 text-white font-bold text-xs focus:outline-none focus:border-orange-500"
                          >
                            {readingPages.map((p) => (
                              <option key={p.pageNumber} value={p.pageNumber} className="bg-zinc-900 text-white">
                                {p.pageNumber}
                              </option>
                            ))}
                          </select>
                          <span className="text-white/40">/ {readingPages.length}</span>
                        </div>

                        <button
                          onClick={() => {
                            stopSpeaking();
                            setIsSpeakingPage(false);
                            setCurrentPageNumber((p) => Math.min(readingPages.length, p + 1));
                          }}
                          disabled={currentPageNumber >= readingPages.length}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold disabled:opacity-30 transition border border-white/10"
                        >
                          <span className="hidden sm:inline">Suivant</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* In-Document Search Input */}
                      <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={readerSearchTerm}
                          onChange={(e) => setReaderSearchTerm(e.target.value)}
                          placeholder="Rechercher sur cette page..."
                          className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
                        />
                        {readerSearchTerm && (
                          <button
                            onClick={() => setReaderSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Document Page Box */}
                  <div className="rounded-3xl bg-[#0c0c0e] border border-white/15 p-5 sm:p-8 shadow-2xl space-y-6">
                    {readerViewMode === 'single' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-white/40 font-mono">
                          <span>DOCUMENT: {readingCourse.title.toUpperCase()}</span>
                          <span>PAGE {currentPageNumber} / {readingPages.length}</span>
                        </div>

                        {readingPages.find((p) => p.pageNumber === currentPageNumber) ? (
                          <div
                            className={`text-white/90 leading-relaxed font-sans whitespace-pre-wrap ${
                              readerFontSize === 'sm'
                                ? 'text-xs leading-5'
                                : readerFontSize === 'base'
                                ? 'text-sm leading-6'
                                : readerFontSize === 'lg'
                                ? 'text-base leading-7'
                                : 'text-lg leading-8'
                            }`}
                          >
                            {readerSearchTerm.trim() ? (
                              highlightSearchMatches(
                                readingPages.find((p) => p.pageNumber === currentPageNumber)!.text,
                                readerSearchTerm
                              )
                            ) : (
                              <div className="markdown-body">
                                <Markdown>
                                  {readingPages.find((p) => p.pageNumber === currentPageNumber)!.text}
                                </Markdown>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-white/40 italic py-8 text-center text-xs">
                            Aucun texte disponible sur cette page.
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/40">
                          <span>DAKIS Offline PDF & Document Reader</span>
                          <button
                            onClick={() => {
                              const cur = readingPages.find((p) => p.pageNumber === currentPageNumber);
                              if (cur) {
                                navigator.clipboard.writeText(cur.text);
                                setCopiedPageText(true);
                                setTimeout(() => setCopiedPageText(false), 2000);
                              }
                            }}
                            className="flex items-center gap-1 text-white/50 hover:text-white transition"
                          >
                            {copiedPageText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPageText ? 'Copié !' : 'Copier la page'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 divide-y divide-white/10">
                        {readingPages.map((p) => (
                          <div key={p.pageNumber} className="pt-6 first:pt-0 space-y-3">
                            <div className="flex items-center justify-between text-xs text-orange-400/80 font-mono font-semibold">
                              <span>--- PAGE {p.pageNumber} SUR {readingPages.length} ---</span>
                              <button
                                onClick={() => {
                                  stopSpeaking();
                                  speakText(p.text);
                                }}
                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-amber-300"
                                title="Lire cette page"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div
                              className={`text-white/90 leading-relaxed font-sans whitespace-pre-wrap ${
                                readerFontSize === 'sm'
                                  ? 'text-xs leading-5'
                                  : readerFontSize === 'base'
                                  ? 'text-sm leading-6'
                                  : readerFontSize === 'lg'
                                  ? 'text-base leading-7'
                                  : 'text-lg leading-8'
                              }`}
                            >
                              <div className="markdown-body">
                                <Markdown>{p.text}</Markdown>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* IN-READER OFFLINE AI ASSISTANT: Ask Questions on this Page / Course */}
                  <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 via-cyan-500/5 to-purple-500/10 border border-orange-500/30 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Assistant IA Hors-Ligne sur ce document</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                              100% Autonome
                            </span>
                          </h4>
                          <p className="text-xs text-white/50">
                            Posez n'importe quelle question sur la page {currentPageNumber} ou sur l'ensemble de {readingCourse.title}.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Prompt Suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        `Explique-moi la page ${currentPageNumber} simplement`,
                        `Quelles sont les formules importantes ici ?`,
                        `Donne-moi un exemple concret d'application`,
                        `Fais-moi un mini-quiz sur cette page`,
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPageQuestionInput(prompt);
                            handleAskPageQuestion(prompt);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 text-white/80 hover:text-white text-[11px] font-medium transition active:scale-95 flex items-center gap-1"
                        >
                          <Lightbulb className="w-3 h-3 text-orange-400" />
                          <span>{prompt}</span>
                        </button>
                      ))}
                    </div>

                    {/* Question Input Box */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pageQuestionInput}
                        onChange={(e) => setPageQuestionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAskPageQuestion();
                          }
                        }}
                        placeholder={`Posez une question sur la page ${currentPageNumber} ou sur ce syllabus...`}
                        className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        onClick={() => handleAskPageQuestion()}
                        disabled={isAnsweringPageQuestion || !pageQuestionInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95 flex items-center gap-1.5"
                      >
                        {isAnsweringPageQuestion ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Demander</span>
                      </button>
                    </div>

                    {/* AI Response Display */}
                    {pageQuestionAnswer && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3 mt-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-xs font-bold text-white">Réponse de DAKIS AI</span>
                            {pageQuestionAnswer.subjectTitle && (
                              <span className="text-[10.5px] text-orange-300 font-medium">
                                • {pageQuestionAnswer.subjectTitle}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleSpeakQA(pageQuestionAnswer.answerText)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-amber-300"
                              title="Écouter la réponse"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyQA(pageQuestionAnswer.answerText)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                              title="Copier la réponse"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="markdown-body text-xs leading-relaxed text-white/90">
                          <Markdown>{pageQuestionAnswer.answerText}</Markdown>
                        </div>

                        {pageQuestionAnswer.suggestedFollowUps && pageQuestionAnswer.suggestedFollowUps.length > 0 && (
                          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-white/40">Questions de suivi :</span>
                            {pageQuestionAnswer.suggestedFollowUps.map((suiv, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setPageQuestionInput(suiv);
                                  handleAskPageQuestion(suiv);
                                }}
                                className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 text-[10.5px] transition"
                              >
                                {suiv}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSISTANT IA & CALCULS OFFLINE */}
          {activeTab === 'search_math' && (
            <div className="space-y-4">
              {/* Big Comfortable Question & Search Bar */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-xl">
                <div className="relative">
                  <MessageSquareQuote className="absolute left-3.5 top-3.5 w-4 h-4 text-orange-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handlePerformSearch(e.target.value)}
                    placeholder="Pose ta question, demande une explication ou un calcul... (ex: C'est quoi la RDM ?, 2x^2 - 5x + 2 = 0, loi d'Ohm, q*L^2/8 avec q=12 L=6, obligations en droit)"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 text-sm text-white placeholder-white/30 focus:outline-none transition shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handlePerformSearch('')}
                      className="absolute right-3 top-3 text-white/40 hover:text-white p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 font-medium">Filtrer par cours :</span>
                    <select
                      value={selectedCourseFilter}
                      onChange={(e) => {
                        setSelectedCourseFilter(e.target.value);
                        if (searchQuery) handlePerformSearch(searchQuery);
                      }}
                      className="bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                    >
                      <option value="all">Tous les cours ({localCourses.length})</option>
                      {localCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.faculty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Moteur IA Sémantique + Math.js 100% Hors-Ligne</span>
                  </div>
                </div>

                {/* Multi-Faculty Fast Question Chips */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-white/50 font-semibold uppercase tracking-wider">
                      💡 Questions fréquentes & Formules par faculté :
                    </span>
                    <span className="text-[10.5px] text-orange-400/80">Cliquez pour tester</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: '📐 C’est quoi la RDM ?', q: 'C koi la resistance des materiaux ?' },
                      { label: '🏗️ Béton Armé & Eurocode 2', q: 'Explique le béton armé et le pivot A et B' },
                      { label: '🧮 Moment fléchissant (q=12, L=6)', q: 'Calculer q*L^2/8 avec q=12 L=6' },
                      { label: '⚡ Loi d’Ohm & Puissance', q: 'Calculer U=R*I avec R=45 et I=3' },
                      { label: '⚖️ Équation 2nd degré', q: '2x^2 - 5x + 2 = 0' },
                      { label: '📈 Dérivée x³ - 4x + 1', q: 'derive x^3 - 4*x + 1' },
                      { label: '⚖️ Droit : Qu’est-ce qu’une obligation ?', q: 'C’est quoi une obligation en droit civil ?' },
                      { label: '🏛️ Hiérarchie des normes (Kelsen)', q: 'Explique la pyramide de Kelsen en droit constitutionnel' },
                      { label: '❤️ Débit Cardiaque & Formule', q: 'Comment calculer le débit cardiaque ?' },
                      { label: '📊 Macroéconomie & PIB', q: 'Comment se calcule le PIB et quelle est son utilité ?' },
                      { label: '🔄 25 bar en MPa', q: '25 bar en mpa' },
                    ].map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(ex.q);
                          handlePerformSearch(ex.q);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-500/20 text-white/75 hover:text-orange-300 border border-white/10 text-[11px] font-medium transition active:scale-95"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 💡 AI SYNTHESIZED ANSWER CARD */}
              {activeQAResponse && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#18181b] via-[#1c1917] to-[#18181b] border border-orange-500/40 space-y-3.5 shadow-2xl animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Assistant Académique DAKIS</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-bold">
                            Hors-Ligne Autonome
                          </span>
                        </div>
                        {activeQAResponse.subjectTitle && (
                          <p className="text-[11px] text-orange-300/80 font-medium">
                            {activeQAResponse.subjectTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSpeechSynthesisSupported() && (
                        <button
                          type="button"
                          onClick={() => handleToggleSpeakQA(activeQAResponse.answerText)}
                          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                            speakingQA
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10'
                          }`}
                          title="Écouter la réponse vocale"
                        >
                          {speakingQA ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span className="text-[11px]">{speakingQA ? 'Arrêter' : 'Écouter'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyQA(activeQAResponse.answerText)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium flex items-center gap-1 transition"
                        title="Copier la réponse"
                      >
                        {copiedQA ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[11px]">{copiedQA ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered Answer Content */}
                  <div className="markdown-body prose prose-invert max-w-none text-white/90 text-sm leading-relaxed prose-p:my-1.5 prose-headings:my-2 prose-headings:text-orange-300 prose-code:bg-white/10 prose-code:text-orange-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                    <Markdown>{activeQAResponse.answerText}</Markdown>
                  </div>

                  {/* Follow-up Question Chips */}
                  {activeQAResponse.suggestedFollowUps && activeQAResponse.suggestedFollowUps.length > 0 && (
                    <div className="pt-3 border-t border-white/10 space-y-1.5">
                      <p className="text-[11px] text-white/40 flex items-center gap-1 font-medium">
                        <CornerDownRight className="w-3 h-3 text-orange-400" />
                        Questions suggérées pour continuer :
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeQAResponse.suggestedFollowUps.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchQuery(prompt);
                              handlePerformSearch(prompt);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/25 text-[11px] transition text-left"
                          >
                            💬 {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Offline Math Calculation Card */}
              {activeMathResult && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/40 space-y-3 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                      <Calculator className="w-4 h-4 text-cyan-400" />
                      <span>
                        {activeMathResult.type === 'equation'
                          ? 'Résolution d’équation'
                          : activeMathResult.type === 'unit_conversion'
                          ? 'Conversion d’unités'
                          : activeMathResult.type === 'pdf_formula'
                          ? 'Application de formule du cours'
                          : 'Calcul Mathématique Direct'}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                      Résultat : {activeMathResult.result}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs text-zinc-300 font-mono">
                    <p className="text-white/50 text-[11px] font-sans font-semibold uppercase tracking-wider">
                      Détail du calcul étape par étape :
                    </p>
                    {activeMathResult.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">➔</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exact Course Snippets & Matches */}
              {hasSearched && searchResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                      Extraits trouvés dans vos cours enregistrés ({searchResults.length})
                    </h3>
                  </div>

                  {searchResults.map((match, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all space-y-2.5 shadow-md"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-400">📄 {match.courseTitle}</span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 font-semibold">Page {match.pageNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold text-[10.5px]">
                            {(match.score * 100).toFixed(0)}% pertinence
                          </span>
                          <button
                            onClick={() => handleOpenReader(match.courseId, match.pageNumber)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-[11px] font-bold transition active:scale-95 shadow-sm"
                            title="Ouvrir cette page dans le lecteur PDF"
                          >
                            <BookOpen className="w-3 h-3 text-orange-400" />
                            <span>Lire Page {match.pageNumber} 📖</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-white/85 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5 font-sans">
                        "{match.highlight || match.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {hasSearched && searchResults.length === 0 && !activeMathResult && !activeQAResponse && (
                <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <Lightbulb className="w-8 h-8 text-orange-400 mx-auto opacity-60" />
                  <p className="text-sm font-semibold text-white/80">Besoin d'une précision ?</p>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    Vous pouvez poser n'importe quelle question sur vos cours (RDM, Béton, Droit, Médecine, Math, Éco) ou importer d'autres cours PDF dans l'onglet "Mes Cours".
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BIBLIOTHÈQUE COMMUNE 🌍 (3 SECTIONS SANS CONFIGURATION) */}
          {activeTab === 'shared_library' && (
            <div className="space-y-4">
              {/* 3 Sub-Sections Switcher */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSharedSubSection('official')}
                  className={`flex-1 min-w-[170px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    sharedSubSection === 'official'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>📚 Cours Officiels DAKIS ({officialCourses.length})</span>
                </button>

                <button
                  onClick={() => setSharedSubSection('internet_archive')}
                  className={`flex-1 min-w-[170px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    sharedSubSection === 'internet_archive'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-cyan-400" />
                  <span>🌐 Livres Publics Gratuits</span>
                </button>

                <button
                  onClick={() => setSharedSubSection('students')}
                  className={`flex-1 min-w-[170px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    sharedSubSection === 'students'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>👥 Cours Partagés Étudiants ({studentCourses.length})</span>
                </button>
              </div>

              {/* SUB-SECTION 1: COURS OFFICIELS DAKIS */}
              {sharedSubSection === 'official' && (
                <div className="space-y-4">
                  {/* Filter bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-amber-400" />
                      <input
                        type="text"
                        value={sharedSearchQuery}
                        onChange={(e) => setSharedSearchQuery(e.target.value)}
                        placeholder="Rechercher parmi les cours officiels..."
                        className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Faculté :</span>
                      <select
                        value={sharedFacultyFilter}
                        onChange={(e) => setSharedFacultyFilter(e.target.value)}
                        className="bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                      >
                        <option value="all">Toutes</option>
                        <option value="Polytechnique">Polytechnique</option>
                        <option value="Droit">Droit</option>
                        <option value="Médecine">Médecine</option>
                        <option value="Économie">Économie</option>
                        <option value="Sciences">Sciences</option>
                      </select>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {officialCourses
                      .filter((c) =>
                        sharedFacultyFilter === 'all' ? true : c.faculty === sharedFacultyFilter
                      )
                      .filter((c) =>
                        sharedSearchQuery
                          ? c.title.toLowerCase().includes(sharedSearchQuery.toLowerCase())
                          : true
                      )
                      .map((course) => {
                        const alreadyDownloaded = localCourses.some((lc) => lc.id === course.id);

                        return (
                          <div
                            key={course.id}
                            className="p-4 rounded-2xl bg-white/5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Crown className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                      {course.title}
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        Officiel
                                      </span>
                                    </h4>
                                    <span className="text-[10.5px] text-amber-300/80 font-medium">
                                      {course.faculty}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {course.description && (
                                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                                  {course.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                                <span>Certifié {course.uploaderName}</span>
                                <span>📄 {course.totalPages} pages</span>
                              </div>
                            </div>

                            {/* Actions: Read & Download */}
                            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                              <button
                                onClick={() => handleOpenReader(course.id, 1)}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition active:scale-95"
                                title="Lire ce document dans le lecteur PDF"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                <span>Lire 📖</span>
                              </button>

                              <button
                                onClick={() => handleDownloadPublicCourse(course)}
                                disabled={alreadyDownloaded}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition active:scale-95 ${
                                  alreadyDownloaded
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/20'
                                }`}
                              >
                                {alreadyDownloaded ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>En local ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Télécharger</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* SUB-SECTION 2: LIVRES PUBLICS GRATUITS (INTERNET ARCHIVE & OPEN BOOKS) */}
              {sharedSubSection === 'internet_archive' && (
                <div className="space-y-4">
                  {/* Search Bar & Preset Chips */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        performArchiveSearch(archiveSearchQuery);
                      }}
                      className="flex items-center gap-2"
                    >
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-cyan-400" />
                        <input
                          type="text"
                          value={archiveSearchQuery}
                          onChange={(e) => setArchiveSearchQuery(e.target.value)}
                          placeholder="Rechercher des livres universitaires gratuits (ex: Béton armé, Droit civil, Électronique, Anatomie...)"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 text-xs text-white placeholder-white/30 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSearchingArchive}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
                      >
                        {isSearchingArchive ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>Chercher</span>
                      </button>
                    </form>

                    {/* Fast Search Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-white/40">Suggestions rapides :</span>
                      {[
                        'Béton armé',
                        'Résistance des matériaux',
                        'Droit civil',
                        'Mécanique des fluides',
                        'Algèbre linéaire',
                        'Anatomie humaine',
                      ].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setArchiveSearchQuery(term);
                            performArchiveSearch(term);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 border border-white/10 text-[10.5px] font-medium transition"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Books Results */}
                  {isSearchingArchive ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                      <p className="text-xs text-white/60">Interrogation de la bibliothèque Internet Archive...</p>
                    </div>
                  ) : archiveBooks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <p className="text-sm font-semibold text-white/70">Aucun livre trouvé pour cette recherche</p>
                      <p className="text-xs text-white/40">
                        Essayez avec d'autres termes comme "Résistance des matériaux", "Béton armé" ou "Droit civil".
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {archiveBooks.map((book) => {
                        const alreadyDownloaded = localCourses.some(
                          (lc) => lc.id === 'archive_' + book.identifier
                        );

                        return (
                          <div
                            key={book.identifier}
                            className="p-4 rounded-2xl bg-white/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <BookMarked className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-bold text-white line-clamp-1">
                                      {book.title}
                                    </h4>
                                    <p className="text-[10.5px] text-cyan-300 truncate max-w-[200px]">
                                      {book.creator} {book.year ? `(${book.year})` : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {book.description && (
                                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                                  {book.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                                <span>⬇ {book.downloads || 0} lectures</span>
                                {book.sizeMb && <span>💾 {book.sizeMb} Mo</span>}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                              <a
                                href={book.detailsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-white/40 hover:text-cyan-300 flex items-center gap-1"
                              >
                                <span>Consulter fiche</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              <button
                                onClick={() => handleDownloadArchiveBook(book)}
                                disabled={alreadyDownloaded}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                                  alreadyDownloaded
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md'
                                }`}
                              >
                                {alreadyDownloaded ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Déjà en local</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Télécharger en offline</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-SECTION 3: COURS PARTAGÉS PAR LES ÉTUDIANTS */}
              {sharedSubSection === 'students' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>Partage Direct entre Étudiants</span>
                      </h4>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Synchronisé instantanément via BroadcastChannel sans inscription ni mot de passe.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowImportChooser(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Partager mes notes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {studentCourses.map((shared) => {
                      const alreadyDownloaded = localCourses.some((lc) => lc.id === shared.id);

                      return (
                        <div
                          key={shared.id}
                          className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  <Users className="w-4 h-4" />
                                </span>
                                <div>
                                  <h4 className="text-sm font-bold text-white">
                                    {shared.title}
                                  </h4>
                                  <span className="text-[10px] text-purple-300 font-medium">
                                    {shared.faculty}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {shared.description && (
                              <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                                {shared.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                              <span>Par {shared.uploaderName || 'Étudiant DAKIS'}</span>
                              <span>📄 {shared.totalPages} pages</span>
                            </div>
                          </div>

                          {/* Download, Read & Report */}
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                            <button
                              onClick={() => handleOpenReader(shared.id, 1)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition active:scale-95"
                              title="Lire ce document"
                            >
                              <BookOpen className="w-3 h-3 text-purple-400" />
                              <span>Lire 📖</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReportCourse(shared.id)}
                                className="text-[11px] text-white/40 hover:text-red-400 flex items-center gap-1 transition p-1"
                                title="Signaler ce cours"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span className="hidden sm:inline">Signaler</span>
                              </button>

                              <button
                                onClick={() => handleDownloadPublicCourse(shared)}
                                disabled={alreadyDownloaded}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                                  alreadyDownloaded
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                }`}
                              >
                                {alreadyDownloaded ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>En local ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Télécharger</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OUTILS D'ÉTUDE (FLASHCARDS, CAS CLINIQUES, FICHES RÉFLEXES, QUIZ, RÉSUMÉ, FORMULES) */}
          {activeTab === 'study_tools' && (
            <div className="space-y-4">
              {/* Course Selector & Tool Switcher */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Cours cible :</span>
                  <select
                    value={selectedStudyCourseId}
                    onChange={(e) => handleRunStudyTool(e.target.value, studyToolView)}
                    className="bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none"
                  >
                    {localCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.faculty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'flashcards')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      studyToolView === 'flashcards'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>🃏</span>
                    <span>Flashcards</span>
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'clinical_cases')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      studyToolView === 'clinical_cases'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>🩺</span>
                    <span>Cas Cliniques</span>
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'reflex_sheets')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      studyToolView === 'reflex_sheets'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>📋</span>
                    <span>Fiches Réflexes</span>
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'quiz')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      studyToolView === 'quiz'
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>❓</span>
                    <span>Quiz QCM</span>
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'summary')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      studyToolView === 'summary'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>📄</span>
                    <span>Résumé</span>
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'formulas')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      studyToolView === 'formulas'
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>📐</span>
                    <span>Formules</span>
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'catalog')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      studyToolView === 'catalog'
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <span>🧮</span>
                    <span>Calculateur</span>
                  </button>
                </div>
              </div>

              {/* View 0: Interactive Flashcards */}
              {studyToolView === 'flashcards' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {activeFlashcards.length === 0 ? (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-white/60 text-xs">
                      Aucune flashcard disponible pour ce cours.
                    </div>
                  ) : (
                    (() => {
                      const card = activeFlashcards[currentFlashcardIdx] || activeFlashcards[0];
                      const totalCards = activeFlashcards.length;
                      const progressPct = Math.round(((currentFlashcardIdx + 1) / totalCards) * 100);

                      return (
                        <div className="space-y-4 max-w-xl mx-auto">
                          {/* Header / Progress */}
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                              <span>🃏 Carte {currentFlashcardIdx + 1} / {totalCards}</span>
                              {card.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                                  {card.category}
                                </span>
                              )}
                            </span>
                            <span>{progressPct}% complété</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* 3D Flashcard Container */}
                          <div
                            onClick={() => setIsCardFlipped(!isCardFlipped)}
                            className="relative min-h-[260px] p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/15 shadow-2xl cursor-pointer hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between group"
                          >
                            <div className="flex items-center justify-between text-[11px] text-white/40">
                              <span className="font-mono uppercase tracking-wider">
                                {isCardFlipped ? '💡 Verso (Réponse)' : '❓ Recto (Question)'}
                              </span>
                              <span className="text-amber-400/80 group-hover:text-amber-300 transition text-[11px]">
                                Cliquez pour retourner ↻
                              </span>
                            </div>

                            <div className="my-auto py-4 text-center">
                              {!isCardFlipped ? (
                                <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                                  {card.recto}
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  <p className="text-sm sm:text-base text-amber-200 font-medium leading-relaxed whitespace-pre-line">
                                    {card.verso}
                                  </p>
                                  {card.sourcePage && (
                                    <span className="inline-block text-[10px] text-white/40 font-mono">
                                      Source : Page {card.sourcePage}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-center text-[11px] text-white/40">
                              {isCardFlipped ? 'Évaluez votre maîtrise ci-dessous' : 'Appuyez pour vérifier la réponse'}
                            </div>
                          </div>

                          {/* Action & Self-Evaluation Controls */}
                          {isCardFlipped && (
                            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in">
                              <button
                                onClick={() => {
                                  setFlashcardMasteredIds((prev) => ({ ...prev, [card.id]: 'hard' as const }));
                                  setIsCardFlipped(false);
                                  if (currentFlashcardIdx < totalCards - 1) {
                                    setCurrentFlashcardIdx(currentFlashcardIdx + 1);
                                  }
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-bold text-xs transition"
                              >
                                🔴 À revoir
                              </button>
                              <button
                                onClick={() => {
                                  setFlashcardMasteredIds((prev) => ({ ...prev, [card.id]: 'medium' as const }));
                                  setIsCardFlipped(false);
                                  if (currentFlashcardIdx < totalCards - 1) {
                                    setCurrentFlashcardIdx(currentFlashcardIdx + 1);
                                  }
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-xs transition"
                              >
                                🟡 Moyen
                              </button>
                              <button
                                onClick={() => {
                                  setFlashcardMasteredIds((prev) => ({ ...prev, [card.id]: 'easy' as const }));
                                  setIsCardFlipped(false);
                                  if (currentFlashcardIdx < totalCards - 1) {
                                    setCurrentFlashcardIdx(currentFlashcardIdx + 1);
                                  }
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition"
                              >
                                🟢 Maîtrisé
                              </button>
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => {
                                if (currentFlashcardIdx > 0) {
                                  setCurrentFlashcardIdx(currentFlashcardIdx - 1);
                                  setIsCardFlipped(false);
                                }
                              }}
                              disabled={currentFlashcardIdx === 0}
                              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-semibold transition flex items-center gap-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Précédente</span>
                            </button>

                            <button
                              onClick={() => {
                                setCurrentFlashcardIdx(0);
                                setIsCardFlipped(false);
                              }}
                              className="text-xs text-white/50 hover:text-white transition"
                            >
                              Recommencer
                            </button>

                            <button
                              onClick={() => {
                                if (currentFlashcardIdx < totalCards - 1) {
                                  setCurrentFlashcardIdx(currentFlashcardIdx + 1);
                                  setIsCardFlipped(false);
                                }
                              }}
                              disabled={currentFlashcardIdx >= totalCards - 1}
                              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-semibold transition flex items-center gap-1"
                            >
                              <span>Suivante</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* View 1: Clinical Cases & Exam Vignettes */}
              {studyToolView === 'clinical_cases' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {activeClinicalCases.length === 0 ? (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-white/60 text-xs">
                      Aucun cas clinique généré pour ce cours.
                    </div>
                  ) : (
                    activeClinicalCases.map((cc, idx) => {
                      const isRevealed = !!revealedCaseIds[cc.id];

                      return (
                        <div
                          key={cc.id || idx}
                          className="p-5 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-4 shadow-xl"
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h4 className="text-sm sm:text-base font-bold text-emerald-400 flex items-center gap-2">
                              <span>🩺</span>
                              <span>{cc.title}</span>
                            </h4>
                            {cc.sourcePage && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 font-mono">
                                Page {cc.sourcePage}
                              </span>
                            )}
                          </div>

                          {/* Patient Vignette */}
                          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                              📋 Énoncé Clinique / Situation :
                            </span>
                            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                              {cc.patientVignette}
                            </p>
                          </div>

                          {/* Key Questions */}
                          {cc.keyQuestions && cc.keyQuestions.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-white/90">❓ Questions d'examen :</span>
                              <ul className="space-y-1">
                                {cc.keyQuestions.map((q, qIdx) => (
                                  <li key={qIdx} className="text-xs text-white/80 flex items-start gap-2">
                                    <span className="text-emerald-400 font-bold">•</span>
                                    <span>{q}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Reveal Solution Button */}
                          <div className="pt-2">
                            <button
                              onClick={() =>
                                setRevealedCaseIds((prev) => ({ ...prev, [cc.id]: !prev[cc.id] }))
                              }
                              className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                                isRevealed
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                              }`}
                            >
                              <span>{isRevealed ? 'Masquer la démarche & solution ▲' : '💡 Révéler la démarche et solution clinique ▼'}</span>
                            </button>
                          </div>

                          {/* Revealed Solution & Protocols */}
                          {isRevealed && (
                            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-3 animate-in fade-in">
                              {cc.recommendedTests && cc.recommendedTests.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-cyan-300">🔍 Bilans & Tests Prioritaires :</span>
                                  <div className="space-y-1">
                                    {cc.recommendedTests.map((t, tIdx) => (
                                      <p key={tIdx} className="text-xs text-white/80 pl-2 border-l border-cyan-500/30">
                                        - {t}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {cc.rehabilitationProtocol && cc.rehabilitationProtocol.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-amber-300">🏋️ Protocole de Rééducation en 3 Phases :</span>
                                  <div className="space-y-1">
                                    {cc.rehabilitationProtocol.map((p, pIdx) => (
                                      <p key={pIdx} className="text-xs text-white/80 pl-2 border-l border-amber-500/30">
                                        {pIdx + 1}. {p}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {cc.redFlagsToWatch && cc.redFlagsToWatch.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-red-400">⚠️ Drapeaux Rouges & Pièges à Éviter :</span>
                                  <div className="space-y-1">
                                    {cc.redFlagsToWatch.map((rf, rfIdx) => (
                                      <p key={rfIdx} className="text-xs text-red-200 pl-2 border-l border-red-500/30">
                                        - {rf}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 border-t border-white/10">
                                <span className="text-xs font-bold text-white/90">🎯 Raisonnement Clinique Global :</span>
                                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                                  {cc.solutionExplanation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* View 2: Reflex Sheets & Clinical Protocols */}
              {studyToolView === 'reflex_sheets' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {activeReflexSheets.length === 0 ? (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-white/60 text-xs">
                      Aucune fiche réflexe disponible pour ce cours.
                    </div>
                  ) : (
                    activeReflexSheets.map((sheet, idx) => (
                      <div
                        key={sheet.id || idx}
                        className="p-5 rounded-3xl bg-zinc-900/80 border border-purple-500/20 space-y-3.5 shadow-xl"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <h4 className="text-sm sm:text-base font-bold text-purple-300 flex items-center gap-2">
                            <span>📋</span>
                            <span>{sheet.title}</span>
                          </h4>
                          {sheet.sourcePage && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">
                              Page {sheet.sourcePage}
                            </span>
                          )}
                        </div>

                        {/* Definition */}
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-purple-200">🎯 1. Définition & Concept Clé :</span>
                          <p className="text-xs text-white/90 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                            {sheet.definition}
                          </p>
                        </div>

                        {/* Signs */}
                        {sheet.symptomsOrSigns && sheet.symptomsOrSigns.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white/90">🔍 2. Signes Cliniques & Anamnèse :</span>
                            <ul className="space-y-1 pl-2">
                              {sheet.symptomsOrSigns.map((s, sIdx) => (
                                <li key={sIdx} className="text-xs text-white/80">
                                  • {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Clinical Tests */}
                        {sheet.clinicalTests && sheet.clinicalTests.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-cyan-300">🩺 3. Bilans & Tests Recommandés :</span>
                            <ul className="space-y-1 pl-2">
                              {sheet.clinicalTests.map((t, tIdx) => (
                                <li key={tIdx} className="text-xs text-white/80">
                                  • {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Red Flags */}
                        {sheet.redFlags && sheet.redFlags.length > 0 && (
                          <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-1">
                            <span className="text-xs font-bold text-red-400">⚠️ 4. Drapeaux Rouges & Contre-indications :</span>
                            <ul className="space-y-0.5">
                              {sheet.redFlags.map((rf, rfIdx) => (
                                <li key={rfIdx} className="text-xs text-red-200">
                                  {rf}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Plan */}
                        {sheet.protocolOrActionPlan && sheet.protocolOrActionPlan.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-amber-300">🏋️ 5. Protocole Thérapeutique & Rééducation :</span>
                            <div className="space-y-1 pl-2">
                              {sheet.protocolOrActionPlan.map((p, pIdx) => (
                                <p key={pIdx} className="text-xs text-white/80">
                                  {pIdx + 1}. {p}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 1: 10-Point Summary */}
              {studyToolView === 'summary' && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-xl">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Résumé Synthétique en 10 Points (Généré 100% Hors-Ligne)</span>
                  </h3>
                  <div className="space-y-2.5 pt-2">
                    {activeSummary.map((pt, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs text-white/90 leading-relaxed pt-0.5">{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 2: Interactive 5-Question Quiz */}
              {studyToolView === 'quiz' && (
                <div className="space-y-4">
                  {activeQuiz.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-md"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-start gap-2">
                        <span className="text-rose-400">Q{qIndex + 1}.</span>
                        <span>{q.question}</span>
                      </h4>

                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = quizUserAnswers[q.id] === optIndex;
                          const isCorrect = optIndex === q.correctIndex;
                          const showResult = quizScore !== null;

                          let btnStyle = 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80';
                          if (isSelected) {
                            btnStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-semibold';
                          }
                          if (showResult) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'bg-red-500/20 border-red-500/50 text-red-300 line-through';
                            }
                          }

                          return (
                            <button
                              key={optIndex}
                              onClick={() => handleQuizAnswer(q.id, optIndex)}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizScore !== null && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11.5px] text-white/70">
                          💡 <span className="font-semibold text-white/90">Explication :</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    {quizScore === null ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizUserAnswers).length < activeQuiz.length}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                          Object.keys(quizUserAnswers).length >= activeQuiz.length
                            ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25 active:scale-95'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        Valider mes réponses ({Object.keys(quizUserAnswers).length}/{activeQuiz.length})
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">
                          Score : <span className="text-rose-400">{quizScore} / {activeQuiz.length}</span>
                        </span>
                        <button
                          onClick={() => {
                            setQuizUserAnswers({});
                            setQuizScore(null);
                          }}
                          className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium"
                        >
                          Recommencer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 3: Formulas */}
              {studyToolView === 'formulas' && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-xl">
                  <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <Sigma className="w-4 h-4" />
                    <span>Formules & Équations Détectées dans ce cours ({activeFormulas.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {activeFormulas.map((f, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <p className="font-mono text-xs text-cyan-300 font-bold">{f.formula}</p>
                        <span className="text-[10px] text-white/40">Page {f.page}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 4: Universal Formula Catalog & Live Offline Calculator */}
              {studyToolView === 'catalog' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Category Filter */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['all', 'Polytechnique / Génie Civil', 'Électrotechnique', 'Physique & Mécanique', 'Médecine & Santé', 'Économie & Finance'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCatalogCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          selectedCatalogCategory === cat
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-white/60'
                        }`}
                      >
                        {cat === 'all' ? '📚 Toutes les matières' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Formula Grid Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {OFFLINE_FORMULA_CATALOG
                      .filter((f) => selectedCatalogCategory === 'all' || f.category === selectedCatalogCategory)
                      .map((formula) => {
                        const isSelected = selectedFormulaId === formula.id;
                        return (
                          <button
                            key={formula.id}
                            onClick={() => handleSelectCatalogFormula(formula)}
                            className={`p-3 rounded-2xl border text-left transition space-y-1 ${
                              isSelected
                                ? 'bg-indigo-950/50 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                                : 'bg-white/5 hover:bg-white/10 border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{formula.name}</span>
                              <span className="text-[10px] text-indigo-300 font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                                {formula.category.split('/')[0]}
                              </span>
                            </div>
                            <p className="font-mono text-xs text-indigo-300 font-semibold">{formula.formula}</p>
                            <p className="text-[11px] text-white/50 line-clamp-1">{formula.description}</p>
                          </button>
                        );
                      })}
                  </div>

                  {/* Active Formula Live Calculator */}
                  {(() => {
                    const currentFormula = OFFLINE_FORMULA_CATALOG.find((f) => f.id === selectedFormulaId) || OFFLINE_FORMULA_CATALOG[0];
                    if (!currentFormula) return null;

                    return (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-black/60 border border-indigo-500/40 space-y-4 shadow-xl">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-indigo-400" />
                              <span>{currentFormula.name}</span>
                            </h4>
                            <p className="text-xs text-white/60 mt-0.5">{currentFormula.description}</p>
                          </div>
                          <div className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {currentFormula.formula}
                          </div>
                        </div>

                        {/* Variables Input Form */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {currentFormula.variables.map((v) => (
                            <div key={v.symbol} className="space-y-1">
                              <label className="text-[11px] text-white/70 font-semibold flex items-center justify-between">
                                <span>{v.name} ({v.symbol})</span>
                                {v.unit && <span className="text-white/40 font-mono text-[10px]">[{v.unit}]</span>}
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={formulaInputs[v.symbol] ?? v.defaultValue ?? 0}
                                onChange={(e) => handleFormulaInputChange(v.symbol, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-indigo-400 text-xs text-white font-mono focus:outline-none transition"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Live Calculation Result & Step-by-Step */}
                        {catalogCalcResult && (
                          <div className="p-4 rounded-xl bg-black/50 border border-indigo-500/30 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white/60">Résultat calculé hors-ligne :</span>
                              <span className="text-sm font-bold text-indigo-300 font-mono px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                {catalogCalcResult.result} {catalogCalcResult.unit || ''}
                              </span>
                            </div>

                            {catalogCalcResult.steps.length > 0 && (
                              <div className="space-y-1 pt-2 border-t border-white/5 text-xs text-white/80 font-mono">
                                <span className="text-[10px] text-white/40 font-sans uppercase font-bold tracking-wider">
                                  Étapes de calcul :
                                </span>
                                {catalogCalcResult.steps.map((st, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="text-indigo-400">➔</span>
                                    <span>{st}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SOLVEUR SCIENTIFIQUE */}
          {activeTab === 'scientific_solver' && (
            <div className="animate-in fade-in duration-200">
              <ScientificSolverView />
            </div>
          )}

          {/* TAB 7: RÉDACTEUR MÉMOIRES & CITATIONS */}
          {activeTab === 'academic_writer' && (
            <div className="animate-in fade-in duration-200">
              <AcademicWriterView />
            </div>
          )}

          {/* TAB 8: STUDIO JURIDIQUE & SYLLOGISME */}
          {activeTab === 'legal_studio' && (
            <div className="animate-in fade-in duration-200">
              <LegalStudioView />
            </div>
          )}

          {/* TAB 9: STUDIO FINANCE & STRATÉGIE */}
          {activeTab === 'finance_studio' && (
            <div className="animate-in fade-in duration-200">
              <FinanceStudioView />
            </div>
          )}

          {/* TAB 10: SIMULATEUR D'EXAMENS BLANCS CHRONOMÉTRÉS */}
          {activeTab === 'mock_exam' && (
            <div className="animate-in fade-in duration-200">
              <MockExamView />
            </div>
          )}
        </div>

        {/* MODAL 1: IMPORT CHOOSER (2 CHOICES: PHONE/PC OR URL) */}
        {showImportChooser && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-4 flex items-center justify-center animate-in fade-in">
            <div className="w-full max-w-sm bg-[#18181b] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-orange-400" />
                  <span>Ajouter un Cours</span>
                </h3>
                <button
                  onClick={() => setShowImportChooser(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setShowImportChooser(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-orange-500/15 border border-white/10 hover:border-orange-500/40 text-left flex items-center gap-3 transition group active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-300">
                      Importer PDF de mon téléphone / PC
                    </h4>
                    <p className="text-[10.5px] text-white/50 mt-0.5">
                      Fichier local .PDF (jusqu'à 25 Mo)
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowImportChooser(false);
                    setImportMode('url');
                  }}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-left flex items-center gap-3 transition group active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                    <Link className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">
                      Importer depuis lien URL
                    </h4>
                    <p className="text-[10.5px] text-white/50 mt-0.5">
                      Lien direct .pdf, Archive.org ou web
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input for Phone/PC */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* MODAL 2: IMPORT CONFIG & DETAILS */}
        {importMode && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-4 sm:p-6 flex items-center justify-center animate-in fade-in">
            <div className="w-full max-w-md bg-[#18181b] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-orange-400" />
                  <span>
                    {importMode === 'file' ? 'Importer PDF Local' : 'Importer depuis URL'}
                  </span>
                </h3>
                <button
                  onClick={() => {
                    setImportMode(null);
                    setUploadFile(null);
                  }}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {importMode === 'url' && (
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Lien URL du PDF :</label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://.../cours.pdf"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-white/60 mb-1 font-medium">Titre du cours :</label>
                  <input
                    type="text"
                    value={courseTitleInput}
                    onChange={(e) => setCourseTitleInput(e.target.value)}
                    placeholder="Ex: Résistance des matériaux - Chapitre 2"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-1 font-medium">Faculté :</label>
                  <select
                    value={facultyInput}
                    onChange={(e) => setFacultyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-white/10 text-white focus:outline-none"
                  >
                    <option value="Polytechnique">Polytechnique</option>
                    <option value="Droit">Droit</option>
                    <option value="Médecine">Médecine</option>
                    <option value="Économie">Économie</option>
                    <option value="Sciences">Sciences</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Partager avec les autres étudiants</p>
                    <p className="text-[10px] text-white/40">Visible dans la Bibliothèque Commune</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareWithStudents}
                    onChange={(e) => setShareWithStudents(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                  />
                </div>

                {shareWithStudents && (
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Description (optionnelle) :</label>
                    <input
                      type="text"
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      placeholder="Ex: Résumé pour l'examen de session 1"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setImportMode(null);
                    setUploadFile(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveImport}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 active:scale-95 transition"
                >
                  Indexer et Sauvegarder en Offline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
