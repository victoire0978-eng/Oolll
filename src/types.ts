export interface CreatorProfile {
  nom: string;
  infos: string;
}

export interface GirlfriendProfile {
  nom: string;
  infos: string;
}

export interface DakisMemory {
  // SHA-256 hashed passwords
  magic_word_hash: string;
  queen_password_hash: string;
  boss_password_hash: string;

  // Optional legacy fields for automatic migration
  magic_word?: string;
  queen_password?: string;
  boss_password?: string;

  creator: CreatorProfile;
  girlfriend: GirlfriendProfile;
  personnes_autorisees: string[];
  personnes_connues: Record<string, string>;
  unlocked_users: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isUnlockedSecret?: boolean;
  isLockedNotice?: boolean;
  confidence?: number; // 0.0 to 1.0
  badge?: 'VERT' | 'ORANGE' | 'ROUGE';
  hasImage?: boolean;
  sourceExcerpt?: string;
  sourcePage?: number;
  sourceCourseId?: string;
  courseId?: string;
  imageUrl?: string;
  canEnrichOnline?: boolean;
  questionForEnrichment?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 📚 OFFLINE COURSES & CHUNKS TYPES
export interface AnticipatedQA {
  question: string;
  answer: string;
  sourcePage?: number;
  tags?: string[];
  verbatim?: string;
  confidence?: number;
  rejectionReason?: string;
  isValidated?: boolean;
  isContradiction?: boolean;
}

export interface PdfImage {
  id?: number;
  pdfId: string;
  pageNumber: number;
  imageBase64: string;
  description?: string;
  ocrText?: string;
  qaList?: AnticipatedQA[];
  createdAt?: number;
}

export interface ValidatedKitResult {
  validated: AnticipatedQA[];
  rejected: (AnticipatedQA & { rejectionReason: string })[];
  reliabilityScore: number; // 0 to 100
}

export interface CourseChunk {
  id?: number;
  courseId: string;
  courseTitle: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  embedding?: number[]; // Local vector representation for cosine similarity
}

export interface ReflexSheet {
  id?: string;
  title: string;
  topic: string;
  definition: string;
  symptomsOrSigns: string[];
  clinicalTests: string[];
  redFlags: string[];
  protocolOrActionPlan: string[];
  sourcePage?: number;
}

export interface ClinicalCase {
  id: string | number;
  title: string;
  patientVignette: string;
  keyQuestions: string[];
  differentialDiagnosis?: string[];
  recommendedTests: string[];
  rehabilitationProtocol: string[];
  redFlagsToWatch?: string[];
  solutionExplanation: string;
  sourcePage?: number;
}

export interface Flashcard {
  id: string | number;
  recto: string;
  verso: string;
  category?: string;
  sourcePage?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  lastReviewed?: number;
}

export interface DecisionTree {
  id: string;
  condition: string;
  branches: {
    criteria: string;
    action: string;
    caution?: string;
  }[];
}

export interface LocalCourse {
  id: string;
  title: string;
  faculty: string;
  totalPages: number;
  fileSize: number; // in bytes
  createdAt: number;
  pdfData?: ArrayBuffer | string; // Stored offline in IndexedDB
  summary?: string[];
  formulas?: string[];
  quiz?: QuizQuestion[];
  anticipatedQA?: AnticipatedQA[];
  rejectedQA?: (AnticipatedQA & { rejectionReason: string })[];
  reliabilityScore?: number;
  reflexSheets?: ReflexSheet[];
  clinicalCases?: ClinicalCase[];
  flashcards?: Flashcard[];
  synonymMap?: Record<string, string[]>;
  images?: PdfImage[];
  imagesCount?: number;
  executiveSummary?: string;
  keyTakeaways?: string[];
  isOfficial?: boolean;
  sharedOnline?: boolean;
  description?: string;
  fullContent?: string;
}

export interface SharedCloudCourse {
  id: string;
  title: string;
  faculty: string;
  totalPages: number;
  fileSize: number;
  createdAt: number;
  uploaderId: string;
  uploaderName?: string;
  downloadUrl?: string;
  fileBase64?: string;
  reportsCount: number;
  isApproved: boolean;
  isOfficial: boolean;
  description?: string;
  sampleText?: string;
  fullContent?: string;
  summary?: string[];
  formulas?: string[];
  quiz?: QuizQuestion[];
  anticipatedQA?: AnticipatedQA[];
  reflexSheets?: ReflexSheet[];
  clinicalCases?: ClinicalCase[];
  flashcards?: Flashcard[];
  executiveSummary?: string;
  keyTakeaways?: string[];
}

export interface SearchResultMatch {
  courseId: string;
  courseTitle: string;
  pageNumber: number;
  text: string;
  score: number; // 0 to 1 (Cosine similarity or matching confidence)
  highlight?: string;
  calculationDetail?: string;
  calculatedValue?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourcePage?: number;
}

export interface FormulaReference {
  id: string;
  name: string;
  category: 'Polytechnique' | 'Béton Armé' | 'Électrotechnique' | 'Mécanique & Fluides' | 'Mathématiques' | 'Physique' | 'Droit' | 'Médecine' | 'Économie';
  formula: string;
  variables: { symbol: string; name: string; unit: string; defaultValue?: number }[];
  calculate: (vars: Record<string, number>) => { result: number | string; unit: string; steps: string[] };
  description: string;
  sourceCourse?: string;
}

// 🧠 1. SPACED REPETITION (SM-2) TYPES
export interface SM2CardItem {
  id: string | number;
  courseId: string;
  courseTitle: string;
  recto: string;
  verso: string;
  category?: string;
  repetitionCount: number;
  easeFactor: number; // default 2.5
  intervalDays: number; // in days
  dueDate: number; // timestamp
  lastReviewedDate?: number;
  lastQualityRating?: number; // 0 to 5
}

export interface SpacedRepetitionStats {
  totalReviewed: number;
  retentionRate: number; // percentage (e.g. 85%)
  streakDays: number;
  dueTodayCount: number;
  masteredCount: number;
  learningCount: number;
}

// 📐 2. SCIENTIFIC SOLVER TYPES
export interface ScientificSolverStep {
  title: string;
  formulaLatex?: string;
  explanation: string;
  intermediateResult?: string;
  pitfallWarning?: string;
}

export interface ScientificSolverSolution {
  problemTitle: string;
  domain: 'Mathématiques' | 'Physique' | 'RDM & Structures' | 'Électronique & Circuits' | 'Thermodynamique' | 'Algorithmique';
  inputsGiven: Record<string, string | number>;
  hypothesisCheck: string[];
  steps: ScientificSolverStep[];
  finalResult: string;
  unit?: string;
  keyTheorems: string[];
}

// 📑 3. ACADEMIC WRITER TYPES
export type CitationStyle = 'APA_7' | 'IEEE' | 'HARVARD' | 'ISO_690' | 'CHICAGO';

export interface BibliographyEntry {
  id: string;
  type: 'book' | 'article' | 'thesis' | 'conference' | 'web';
  authors: string[];
  title: string;
  year: number | string;
  publisherOrJournal?: string;
  volume?: string;
  pages?: string;
  doiOrUrl?: string;
}

export interface AcademicSection {
  title: string;
  standardPercentage: number;
  guidelines: string;
  suggestedContent: string;
  bulletPoints: string[];
}

export interface AcademicPlanTemplate {
  id: string;
  type: 'memoire_master' | 'rapport_stage' | 'article_scientifique' | 'these_doctorat' | 'projet_ingenieur';
  title: string;
  description: string;
  sections: AcademicSection[];
}

// ⚖️ 4. LEGAL STUDIO TYPES
export interface LegalSyllogismCase {
  id: string;
  title: string;
  subjectCategory: 'Droit Civil & Obligations' | 'Droit Pénal' | 'Droit Constitutionnel' | 'Droit des Affaires & Sociétés' | 'Droit Administratif';
  factsSummary: string;
  qualifiedFacts: string[];
  legalQuestion: string;
  majorLegalRule: string[];
  jurisprudenceReferences: string[];
  minorApplication: string[];
  conclusion: string;
}

export interface CourtRulingAnalysis {
  court: string;
  date: string;
  jurisdiction: string;
  facts: string;
  proceduralHistory: string;
  claimsOfParties: { appellant: string; respondent: string };
  legalProblem: string;
  courtSolution: string;
  doctrineScope: string;
}

// 📊 5. FINANCE & STRATEGY STUDIO TYPES
export interface FinancialSIGResult {
  chiffreAffaires: number;
  margeCommerciale: number;
  valeurAjoutee: number;
  excedentBrutExploitation: number;
  resultatExploitation: number;
  resultatCourantAvantImpot: number;
  resultatNet: number;
  capaciteAutofinancement: number;
}

export interface FinancialBalanceSheetResult {
  frng: number; // Fonds de Roulement Net Global
  bfr: number; // Besoin en Fonds de Roulement
  tresorerieNette: number; // TN = FRNG - BFR
  ratioLiquiditeGenerale: number;
  ratioAutonomieFinanciere: number;
  interpretation: string[];
}

export interface InvestmentNPVIRRResult {
  van: number; // Net Present Value
  triEstimated: number; // Internal Rate of Return (%)
  indiceProfitabilite: number;
  delaiRecuperationAnnees: number;
  isProfitable: boolean;
  steps: string[];
}

export interface StrategicMatrixAnalysis {
  companyOrProjectName: string;
  industry: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  pestel: {
    political: string[];
    economic: string[];
    social: string[];
    technological: string[];
    environmental: string[];
    legal: string[];
  };
  porterFiveForces: {
    threatNewEntrants: { level: 'Faible' | 'Modéré' | 'Élevé'; details: string };
    bargainingPowerSuppliers: { level: 'Faible' | 'Modéré' | 'Élevé'; details: string };
    bargainingPowerBuyers: { level: 'Faible' | 'Modéré' | 'Élevé'; details: string };
    threatSubstitutes: { level: 'Faible' | 'Modéré' | 'Élevé'; details: string };
    competitiveRivalry: { level: 'Faible' | 'Modéré' | 'Élevé'; details: string };
  };
}

// 🏆 6. MOCK EXAM ENGINE TYPES
export interface MockExamQuestion {
  id: number;
  type: 'qcm' | 'calcul_ouvert' | 'reflexion_clinique_ou_juridique';
  discipline: string;
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswerText?: string;
  points: number;
  explanation: string;
  hint?: string;
}

export interface MockExamConfig {
  faculty: string;
  title: string;
  durationMinutes: number;
  questionsCount: number;
  totalPoints: number; // standard 20
}

export interface MockExamResult {
  score: number; // out of 20
  percentage: number;
  timeSpentSeconds: number;
  status: 'passed' | 'failed' | 'honors';
  questionReviews: {
    questionId: number;
    userAnswer: number | string;
    isCorrect: boolean;
    pointsAwarded: number;
    maxPoints: number;
    explanation: string;
  }[];
  generalFeedback: string;
  strongAreas: string[];
  weakAreas: string[];
}
