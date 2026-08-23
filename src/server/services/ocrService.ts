import Tesseract from 'tesseract.js';
import vision from '@google-cloud/vision';

const hasGoogleKey = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

export async function detectTextWithGoogleVision(buffer: Buffer) {
  if (!hasGoogleKey) throw new Error('Google credentials not configured');
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.documentTextDetection({ image: { content: buffer } });
  return result.fullTextAnnotation?.text || '';
}

export async function detectTextWithTesseract(buffer: Buffer, mimetype: string) {
  // Convert buffer to data URL for Tesseract
  const imageBase64 = buffer.toString('base64');
  const dataurl = `data:${mimetype};base64,${imageBase64}`;
  const res = await Tesseract.recognize(dataurl, 'fra+eng', {
    logger: m => {} // silence logs or implement logger
  } as any);
  return res.data.text || '';
}
