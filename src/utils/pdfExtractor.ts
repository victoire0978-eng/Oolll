import { CourseChunk, PdfImage, AnticipatedQA } from '../types';
import { savePdfImages } from './courseDb';

export interface ExtractedPdfResult {
  title: string;
  totalPages: number;
  fileSize: number;
  chunks: CourseChunk[];
  formulas: string[];
  summaryPoints: string[];
  fullText: string;
  images: PdfImage[];
  imageQAs: AnticipatedQA[];
}

let pdfjsLibCache: any = null;

async function getPdfJsLib(): Promise<any> {
  if (pdfjsLibCache) return pdfjsLibCache;

  try {
    // Dynamically import legacy build for universal browser compatibility
    const mod: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLibCache = mod.default || mod;

    if (typeof window !== 'undefined' && pdfjsLibCache?.GlobalWorkerOptions) {
      pdfjsLibCache.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLibCache.version || '4.10.38'}/pdf.worker.min.mjs`;
    }
    return pdfjsLibCache;
  } catch (err) {
    console.warn('Failed to load legacy pdfjs-dist, trying default import:', err);
    try {
      const mod: any = await import('pdfjs-dist');
      pdfjsLibCache = mod.default || mod;
      return pdfjsLibCache;
    } catch (fallbackErr) {
      console.error('PDF.js could not be loaded:', fallbackErr);
      return null;
    }
  }
}

/**
 * Extract text, chunks (400 chars + 100 overlap), formulas, images and summary from a PDF file
 */
export async function extractPdfContent(
  file: File | ArrayBuffer,
  fileName: string,
  courseId: string,
  faculty: string = 'Général'
): Promise<ExtractedPdfResult> {
  let arrayBuffer: ArrayBuffer;
  let fileSize = 0;

  if (file instanceof File) {
    fileSize = file.size;
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
    fileSize = arrayBuffer.byteLength;
  }

  const cleanCourseTitle = fileName.replace(/\.[^/.]+$/, '').trim();
  const chunks: CourseChunk[] = [];
  const extractedFormulas: Set<string> = new Set();
  const significantSentences: string[] = [];
  const extractedImages: PdfImage[] = [];
  const imageQAs: AnticipatedQA[] = [];
  let fullText = '';
  let totalPages = 1;

  try {
    const pdfjsLib = await getPdfJsLib();

    if (pdfjsLib && pdfjsLib.getDocument) {
      // Load PDF with pdfjs
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages || 1;

      // Iterate over each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        let pageText = '';
        let lastY: number | null = null;

        for (const item of textContent.items as any[]) {
          if (item.str) {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
              pageText += '\n';
            } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
              pageText += ' ';
            }
            pageText += item.str;
            lastY = item.transform[5];
          }
        }

        pageText = pageText.trim();
        if (pageText) {
          fullText += `\n--- Page ${pageNum} ---\n` + pageText;
          extractFormulasFromText(pageText, extractedFormulas);
          extractKeySentences(pageText, significantSentences);

          // Chunking: 400 chars with 100 chars overlap
          const chunkSize = 400;
          const overlap = 100;
          let startIdx = 0;
          let chunkIndex = 0;

          while (startIdx < pageText.length) {
            const endIdx = Math.min(startIdx + chunkSize, pageText.length);
            const chunkText = pageText.slice(startIdx, endIdx).trim();

            if (chunkText.length > 30) {
              const embedding = generateOfflineEmbedding(chunkText);
              chunks.push({
                courseId,
                courseTitle: cleanCourseTitle,
                pageNumber: pageNum,
                chunkIndex,
                text: chunkText,
                embedding,
              });
              chunkIndex++;
            }

            if (endIdx >= pageText.length) break;
            startIdx += chunkSize - overlap;
          }
        }

        // 🖼️ Extract thumbnail / schemas if in browser environment
        if (typeof document !== 'undefined') {
          try {
            const viewport = page.getViewport({ scale: 1 });
            const maxDim = 300;
            const scale = Math.min(maxDim / Math.max(viewport.width, viewport.height), 0.75);
            const scaledViewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(100, Math.floor(scaledViewport.width));
            canvas.height = Math.max(100, Math.floor(scaledViewport.height));
            const ctx = canvas.getContext('2d');

            if (ctx) {
              await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
              const imageBase64 = canvas.toDataURL('image/jpeg', 0.6);

              let description = `Schéma / Figure de la page ${pageNum}`;
              let ocrText = '';
              let pageQAs: AnticipatedQA[] = [];

              // If online, call Gemini Vision for key pages (up to first 3 pages) to describe schemas & generate Q&As
              if (typeof navigator !== 'undefined' && navigator.onLine && pageNum <= 3) {
                try {
                  const visionResp = await fetch('/api/describe-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      imageBase64,
                      title: cleanCourseTitle,
                      pageNumber: pageNum,
                    }),
                  });

                  if (visionResp.ok) {
                    const vData = await visionResp.json();
                    if (vData.description) description = vData.description;
                    if (vData.ocrText) ocrText = vData.ocrText;
                    if (Array.isArray(vData.qaList) && vData.qaList.length > 0) {
                      pageQAs = vData.qaList;
                      imageQAs.push(...pageQAs);
                    }
                  }
                } catch (vErr) {
                  // Graceful degradation when network/vision model is busy
                }
              }

              const pdfImg: PdfImage = {
                pdfId: courseId,
                pageNumber: pageNum,
                imageBase64,
                description,
                ocrText,
                qaList: pageQAs,
                createdAt: Date.now(),
              };

              extractedImages.push(pdfImg);
            }
          } catch (imgErr) {
            console.warn('Could not extract image for page', pageNum, imgErr);
          }
        }
      }

      // Save extracted images to Dexie table
      if (extractedImages.length > 0) {
        await savePdfImages(extractedImages);
      }
    } else {
      throw new Error('PDF library unavailable');
    }
  } catch (pdfErr) {
    console.warn('PDF extraction fell back to text decoding:', pdfErr);
    // Fallback: decode raw text from buffer if PDF parser failed or was plain text
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      const readableText = text.replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\r\n/g, '\n').trim();
      if (readableText.length > 30) {
        fullText = readableText;
        extractFormulasFromText(readableText, extractedFormulas);
        extractKeySentences(readableText, significantSentences);

        const pageSections = readableText.split(/(?:^|\n)--- Page (\d+)[^\n]* ---\n?/i);

        if (pageSections.length > 2) {
          let chunkIndex = 0;
          let maxPage = 1;

          for (let i = 1; i < pageSections.length; i += 2) {
            const pageNum = parseInt(pageSections[i], 10) || Math.floor(i / 2) + 1;
            const pageContent = (pageSections[i + 1] || '').trim();
            if (!pageContent) continue;
            maxPage = Math.max(maxPage, pageNum);

            const chunkSize = 400;
            const overlap = 100;
            let startIdx = 0;

            while (startIdx < pageContent.length) {
              const endIdx = Math.min(startIdx + chunkSize, pageContent.length);
              const chunkText = pageContent.slice(startIdx, endIdx).trim();
              if (chunkText.length > 25) {
                const embedding = generateOfflineEmbedding(chunkText);
                chunks.push({
                  courseId,
                  courseTitle: cleanCourseTitle,
                  pageNumber: pageNum,
                  chunkIndex,
                  text: chunkText,
                  embedding,
                });
                chunkIndex++;
              }
              if (endIdx >= pageContent.length) break;
              startIdx += chunkSize - overlap;
            }
          }
          totalPages = maxPage;
        } else {
          const chunkSize = 400;
          const overlap = 100;
          let startIdx = 0;
          let chunkIndex = 0;

          while (startIdx < readableText.length) {
            const endIdx = Math.min(startIdx + chunkSize, readableText.length);
            const chunkText = readableText.slice(startIdx, endIdx).trim();
            if (chunkText.length > 25) {
              const embedding = generateOfflineEmbedding(chunkText);
              const approxPage = Math.floor(startIdx / 800) + 1;
              chunks.push({
                courseId,
                courseTitle: cleanCourseTitle,
                pageNumber: approxPage,
                chunkIndex,
                text: chunkText,
                embedding,
              });
              chunkIndex++;
            }
            if (endIdx >= readableText.length) break;
            startIdx += chunkSize - overlap;
          }
          totalPages = Math.max(1, Math.ceil(readableText.length / 800));
        }
      }
    } catch (e) {
      console.error('Fallback text decoding failed:', e);
    }
  }

  // Generate 10-point offline summary
  const summaryPoints = generate10PointSummary(significantSentences);

  return {
    title: cleanCourseTitle,
    totalPages: Math.max(1, totalPages),
    fileSize,
    chunks,
    formulas: Array.from(extractedFormulas).slice(0, 40),
    summaryPoints,
    fullText,
    images: extractedImages,
    imageQAs,
  };
}

/**
 * Extract formulas, equations and definitions from text
 */
function extractFormulasFromText(text: string, formulasSet: Set<string>) {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 150) continue;

    // Check for mathematical equations or explicit Formula markers
    const hasEquals = trimmed.includes('=') && /[a-zA-Z0-9]/.test(trimmed);
    const hasFormulaKeyword =
      /formule|équation|theoreme|loi|propriete|principe|article/i.test(trimmed);
    const hasMathSymbols = /[+\-*/^√∫∑λσεΔσμω]/.test(trimmed) && trimmed.includes('=');

    if (hasFormulaKeyword || hasMathSymbols || (hasEquals && !trimmed.startsWith('//'))) {
      // Clean up punctuation
      const cleaned = trimmed.replace(/\s+/g, ' ').replace(/[;,.]$/, '');
      if (cleaned.length >= 6) {
        formulasSet.add(cleaned);
      }
    }
  }
}

/**
 * Extract key declarative sentences for offline summary
 */
function extractKeySentences(text: string, sentencesList: string[]) {
  const rawSentences = text.split(/(?<=[.?!])\s+/);
  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 40 && trimmed.length < 250) {
      // Check if it looks like a definition or key statement
      if (
        /défini|consiste|est un|est une|permet de|se compose|signifie|a pour objet|principe|important|caractérise/i.test(
          trimmed
        )
      ) {
        sentencesList.push(trimmed);
      }
    }
  }
}

/**
 * Generate 10 concise points from key sentences
 */
function generate10PointSummary(sentences: string[]): string[] {
  if (sentences.length === 0) {
    return [
      'Document importé avec succès en mode local.',
      'Contenu textuel indexé page par page.',
      'Prêt pour les calculs et la recherche sémantique hors-ligne.',
    ];
  }

  // Deduplicate and pick top 10 evenly spaced points
  const unique = Array.from(new Set(sentences));
  if (unique.length <= 10) return unique;

  const step = unique.length / 10;
  const result: string[] = [];
  for (let i = 0; i < 10; i++) {
    const idx = Math.min(Math.floor(i * step), unique.length - 1);
    result.push(unique[idx]);
  }
  return result;
}

/**
 * Generate a 64-dimensional local normalized vector embedding
 * 100% offline using character n-grams and hashing trick (fast & zero overhead)
 */
export function generateOfflineEmbedding(text: string): number[] {
  const dim = 64;
  const vector = new Array(dim).fill(0);
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = normalized.split(/\W+/).filter((w) => w.length > 2);

  // Unigrams & Bigrams
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash * 31 + word.charCodeAt(j)) & 0xffffffff;
    }
    const idx1 = Math.abs(hash) % dim;
    vector[idx1] += 1.0;

    // Bigram
    if (i < words.length - 1) {
      const bigram = word + '_' + words[i + 1];
      let biHash = 0;
      for (let j = 0; j < bigram.length; j++) {
        biHash = (biHash * 37 + bigram.charCodeAt(j)) & 0xffffffff;
      }
      const idx2 = Math.abs(biHash) % dim;
      vector[idx2] += 1.5;
    }
  }

  // L2 Norm normalization
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}
