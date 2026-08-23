import { LocalCourse, AnticipatedQA, Message } from '../types';
import { db, getLocalCourseById, getCourseChunks, updateLocalCourse } from './courseDb';

export interface EnrichResult {
  success: boolean;
  message: Message;
  newQA?: AnticipatedQA;
  addedQA?: AnticipatedQA;
  courseTitle?: string;
  sourceExcerpt?: string;
}

/**
 * Handles the "Repasser en ligne" (Go back online to verify) action:
 * 1. Queries Gemini with the student's question and verified course content
 * 2. Retrieves the precise answer with citations and confidence score
 * 3. Adds the verified Q&A into the local IndexedDB offline kit for future offline sessions
 * 4. Returns a ready message object configured with Badge VERT and verified excerpt
 */
export async function enrichOfflineKit(
  question: string,
  courseId?: string,
  userMessageId?: string
): Promise<EnrichResult> {
  try {
    let course: LocalCourse | undefined;
    let chunksText = '';

    if (courseId) {
      course = await getLocalCourseById(courseId);
      const chunks = await getCourseChunks(courseId);
      chunksText = chunks.map((c) => `[P.${c.pageNumber}] ${c.text}`).join('\n\n');
    } else {
      // Find all courses or most relevant course
      const allCourses = await db.courses.toArray();
      if (allCourses.length > 0) {
        course = allCourses[0];
        const chunks = await getCourseChunks(course.id);
        chunksText = chunks.map((c) => `[P.${c.pageNumber}] ${c.text}`).join('\n\n');
      }
    }

    const courseTitle = course?.title || 'Cours général';

    // Call server Gemini enrichment endpoint
    const response = await fetch('/api/enrich-course-faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        courseTitle,
        courseId: course?.id,
        chunksText: chunksText.slice(0, 24000),
        fullContent: (course?.fullContent || '').slice(0, 24000),
      }),
    });

    if (!response.ok) {
      throw new Error(`Enrichment failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.success || !data.result) {
      throw new Error('Réponse invalide du serveur.');
    }

    const res = data.result;
    const confidence = res.confidence !== undefined ? res.confidence : 0.95;
    const verbatim = res.verbatim || res.sourceExcerpt || '';
    const sourceExcerpt = res.sourceExcerpt || verbatim;
    const sourcePage = res.sourcePage || 1;

    // Create new verified AnticipatedQA
    const newQA: AnticipatedQA = {
      question,
      answer: res.answer,
      verbatim,
      confidence,
      sourcePage,
      isValidated: true,
      tags: ['Enrichi en Ligne', 'Vérifié'],
    };

    // Save into local IndexedDB course anticipatedQA list if course exists
    if (course) {
      const existingQAs = course.anticipatedQA || [];
      // Check if duplicate question already present
      const isDuplicate = existingQAs.some(
        (q) => q.question.trim().toLowerCase() === question.trim().toLowerCase()
      );

      if (!isDuplicate) {
        course.anticipatedQA = [newQA, ...existingQAs];
        await updateLocalCourse(course);
      }
    }

    // Build model message with VERT badge
    const enrichedMessage: Message = {
      id: `enrich_${Date.now()}`,
      role: 'model',
      content: res.answer,
      timestamp: Date.now(),
      confidence: Math.max(0.85, confidence),
      badge: 'VERT',
      sourceExcerpt,
      sourcePage,
      sourceCourseId: course?.id,
      canEnrichOnline: false,
    };

    return {
      success: true,
      message: enrichedMessage,
      newQA,
      addedQA: newQA,
      courseTitle,
      sourceExcerpt,
    };
  } catch (error: any) {
    console.error('enrichOfflineKit error:', error);
    // Fallback response
    return {
      success: false,
      message: {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `⚠️ Impossible de joindre le serveur pour enrichir cette question. Veuillez vérifier votre connexion internet et réessayer.`,
        timestamp: Date.now(),
        badge: 'ROUGE',
        confidence: 0.2,
      },
    };
  }
}
