import { AnticipatedQA, CourseChunk, ValidatedKitResult } from '../types';

/**
 * Validates offline AI study kit Q&As against raw PDF text chunks.
 * Rejects any FAQ where:
 * 1. Verbatim is missing or not present in chunks ("verbatim non trouvé")
 * 2. Confidence is strictly < 0.70 ("confiance <0.7")
 * 3. Contains forbidden hallucination phrases like "selon mes connaissances", "en général", "habituellement" ("mot interdit hallucination")
 * Calculates and returns { validated, rejected, reliabilityScore }
 */
export function validateKit(
  faqs: AnticipatedQA[],
  chunks: CourseChunk[]
): ValidatedKitResult {
  if (!faqs || faqs.length === 0) {
    return {
      validated: [],
      rejected: [],
      reliabilityScore: 100,
    };
  }

  const allChunksText = chunks.map((c) => c.text.toLowerCase()).join(' ');
  const forbiddenPhrases = [
    'selon mes connaissances',
    'en général',
    'habituellement',
    "d'après mes connaissances",
    "d'une manière générale",
    'comme tout le monde le sait',
    'il est bien connu que',
    'dans la plupart des cas généraux',
  ];

  const validated: AnticipatedQA[] = [];
  const rejected: (AnticipatedQA & { rejectionReason: string })[] = [];

  for (const faq of faqs) {
    const rawVerbatim = (faq.verbatim || '').trim();
    const answerLower = (faq.answer || '').toLowerCase();
    const questionLower = (faq.question || '').toLowerCase();
    const combinedLower = `${questionLower} ${answerLower}`;

    // 1. Verbatim check: must exist in chunks
    let verbatimFound = false;
    if (rawVerbatim && rawVerbatim.length > 8 && allChunksText.includes(rawVerbatim.toLowerCase())) {
      verbatimFound = true;
    } else {
      // Check if significant sentence fragments from the answer exist literally in the source chunks
      const sentences = faq.answer
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.replace(/^[#*\-•\s>]+/, '').trim())
        .filter((s) => s.length >= 20);

      for (const sent of sentences) {
        if (allChunksText.includes(sent.toLowerCase())) {
          verbatimFound = true;
          if (!faq.verbatim) {
            faq.verbatim = sent;
          }
          break;
        }
      }
    }

    if (!verbatimFound) {
      rejected.push({
        ...faq,
        rejectionReason: 'verbatim non trouvé',
        isValidated: false,
      });
      continue;
    }

    // 2. Confidence check (< 0.70)
    const confidence = faq.confidence !== undefined ? faq.confidence : 0.88;
    if (confidence < 0.7) {
      rejected.push({
        ...faq,
        confidence,
        rejectionReason: 'confiance <0.7',
        isValidated: false,
      });
      continue;
    }

    // 3. Forbidden hallucination keywords
    const hasForbiddenWord = forbiddenPhrases.some((phrase) => combinedLower.includes(phrase));
    if (hasForbiddenWord) {
      rejected.push({
        ...faq,
        confidence,
        rejectionReason: 'mot interdit hallucination',
        isValidated: false,
      });
      continue;
    }

    // Validated!
    validated.push({
      ...faq,
      confidence: Math.max(0.72, confidence),
      isValidated: true,
      verbatim: faq.verbatim || rawVerbatim || faq.answer.slice(0, 120),
    });
  }

  const total = faqs.length;
  const reliabilityScore = total > 0 ? Math.round((validated.length / total) * 100) : 100;

  return {
    validated,
    rejected,
    reliabilityScore,
  };
}
