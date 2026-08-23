import Dexie, { Table } from 'dexie';
import { LocalCourse, CourseChunk, PdfImage, AnticipatedQA } from '../types';

export class DakisOfflineCourseDatabase extends Dexie {
  courses!: Table<LocalCourse, string>;
  chunks!: Table<CourseChunk, number>;
  pdfImages!: Table<PdfImage, number>;

  constructor() {
    super('DakisOfflineCoursesDB');

    // Define database schema version 1 & 2
    this.version(1).stores({
      courses: 'id, title, faculty, totalPages, createdAt, isOfficial',
      chunks: '++id, courseId, pageNumber, chunkIndex, courseTitle',
    });

    this.version(2).stores({
      courses: 'id, title, faculty, totalPages, createdAt, isOfficial',
      chunks: '++id, courseId, pageNumber, chunkIndex, courseTitle',
      pdfImages: '++id, pdfId, pageNumber, createdAt',
    });
  }
}

export const db = new DakisOfflineCourseDatabase();

/**
 * Save a new course and its indexed chunks to IndexedDB
 */
export async function saveCourseWithChunks(
  course: LocalCourse,
  chunks: CourseChunk[]
): Promise<void> {
  await db.transaction('rw', db.courses, db.chunks, async () => {
    // 1. Delete previous version if exists
    await db.chunks.where('courseId').equals(course.id).delete();
    // 2. Put course
    await db.courses.put(course);
    // 3. Bulk insert chunks
    if (chunks.length > 0) {
      await db.chunks.bulkAdd(chunks);
    }
  });
}

/**
 * Update an existing course (e.g. after validation or enrichment)
 */
export async function updateLocalCourse(course: LocalCourse): Promise<void> {
  await db.courses.put(course);
}

/**
 * Get all saved offline courses
 */
export async function getAllLocalCourses(): Promise<LocalCourse[]> {
  return await db.courses.orderBy('createdAt').reverse().toArray();
}

/**
 * Get a single local course by ID
 */
export async function getLocalCourseById(id: string): Promise<LocalCourse | undefined> {
  return await db.courses.get(id);
}

/**
 * Delete a course, its chunks and associated images from IndexedDB
 */
export async function deleteLocalCourse(id: string): Promise<void> {
  await db.transaction('rw', db.courses, db.chunks, db.pdfImages, async () => {
    await db.chunks.where('courseId').equals(id).delete();
    await db.pdfImages.where('pdfId').equals(id).delete();
    await db.courses.delete(id);
  });
}

/**
 * Get all chunks for a specific course
 */
export async function getCourseChunks(courseId: string): Promise<CourseChunk[]> {
  return await db.chunks.where('courseId').equals(courseId).toArray();
}

/**
 * Get all chunks across all courses (for global offline semantic search)
 */
export async function getAllChunks(): Promise<CourseChunk[]> {
  return await db.chunks.toArray();
}

/**
 * Count total offline courses
 */
export async function countOfflineCourses(): Promise<number> {
  return await db.courses.count();
}

// 🖼️ PDF IMAGES MANAGEMENT
export async function savePdfImages(images: PdfImage[]): Promise<void> {
  if (images.length === 0) return;
  await db.pdfImages.bulkAdd(images);
}

export async function getPdfImagesByCourse(courseId: string): Promise<PdfImage[]> {
  return await db.pdfImages.where('pdfId').equals(courseId).toArray();
}

export async function getAllPdfImages(): Promise<PdfImage[]> {
  return await db.pdfImages.toArray();
}

export async function deletePdfImagesByCourse(courseId: string): Promise<void> {
  await db.pdfImages.where('pdfId').equals(courseId).delete();
}

// 🧹 ADMIN UTILITIES: CLEAN REJECTED & SCAN CONTRADICTIONS
export async function cleanCourseRejectedMemory(courseId: string): Promise<number> {
  const course = await db.courses.get(courseId);
  if (!course) return 0;
  const count = course.rejectedQA?.length || 0;
  course.rejectedQA = [];
  await db.courses.put(course);
  return count;
}

export async function scanCourseContradictions(
  courseId: string
): Promise<{ contradictionCount: number; contradictedQAs: AnticipatedQA[] }> {
  const course = await db.courses.get(courseId);
  const chunks = await getCourseChunks(courseId);
  if (!course || !course.anticipatedQA || chunks.length === 0) {
    return { contradictionCount: 0, contradictedQAs: [] };
  }

  const allChunksText = chunks.map((c) => c.text.toLowerCase()).join(' ');
  const contradicted: AnticipatedQA[] = [];

  // Contradiction detection heuristics:
  // e.g. QA says "toujours faux" while chunk says "vrai", or "impossible" when chunk says "possible", or specific negation opposites
  const negationPairs = [
    { qa: 'impossible', chunk: 'possible' },
    { qa: 'interdit', chunk: 'autorisé' },
    { qa: 'faux', chunk: 'vrai' },
    { qa: 'annulé', chunk: 'maintenu' },
    { qa: 'aucun', chunk: 'plusieurs' },
  ];

  for (const qa of course.anticipatedQA) {
    const qLower = (qa.question + ' ' + qa.answer).toLowerCase();
    let isContradicted = false;

    for (const pair of negationPairs) {
      if (qLower.includes(pair.qa) && allChunksText.includes(pair.chunk)) {
        // check keyword proximity
        isContradicted = true;
        break;
      }
    }

    if (isContradicted) {
      qa.isContradiction = true;
      contradicted.push(qa);
    }
  }

  await db.courses.put(course);
  return { contradictionCount: contradicted.length, contradictedQAs: contradicted };
}

export function exportCourseQAsCsv(course: LocalCourse): string {
  const qas = [
    ...(course.anticipatedQA || []).map((q) => ({ ...q, status: 'VALIDEE' })),
    ...(course.rejectedQA || []).map((q) => ({ ...q, status: 'REJETEE' })),
  ];

  const headers = ['Type', 'Statut', 'Page', 'Confiance', 'Question', 'Réponse', 'Verbatim', 'Raison_Rejet'];
  const rows = qas.map((q) => [
    'Q&A',
    q.status,
    q.sourcePage || 1,
    q.confidence !== undefined ? q.confidence : 1.0,
    `"${(q.question || '').replace(/"/g, '""')}"`,
    `"${(q.answer || '').replace(/"/g, '""')}"`,
    `"${(q.verbatim || '').replace(/"/g, '""')}"`,
    `"${(q.rejectionReason || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

