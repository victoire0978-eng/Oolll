import { SM2CardItem, SpacedRepetitionStats } from '../types';

const SM2_STORAGE_KEY = 'dakis_spaced_repetition_cards_v2';
const SM2_ACTIVITY_KEY = 'dakis_spaced_repetition_activity_v2';

/**
 * Get all SM-2 tracking cards from localStorage
 */
export function getSM2Cards(): SM2CardItem[] {
  try {
    const raw = localStorage.getItem(SM2_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save SM-2 cards to localStorage
 */
export function saveSM2Cards(cards: SM2CardItem[]): void {
  try {
    localStorage.setItem(SM2_STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {}
}

/**
 * SuperMemo SM-2 core calculation
 * @param card Current card state
 * @param quality Score from 0 (blackout) to 5 (perfect response)
 * Quality ratings:
 * 5 - perfect response
 * 4 - correct response after a hesitation
 * 3 - correct response recalled with serious difficulty
 * 2 - incorrect response; where the correct one seemed easy to recall
 * 1 - incorrect response; the correct one remembered
 * 0 - complete blackout.
 */
export function reviewSM2Card(card: SM2CardItem, quality: number): SM2CardItem {
  const q = Math.max(0, Math.min(5, quality));
  let { repetitionCount, easeFactor, intervalDays } = card;

  if (q >= 3) {
    // Correct response
    if (repetitionCount === 0) {
      intervalDays = 1;
    } else if (repetitionCount === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitionCount += 1;
  } else {
    // Incorrect response, reset repetitions
    repetitionCount = 0;
    intervalDays = 1;
  }

  // Update Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3; // minimum floor

  const now = Date.now();
  const nextDueDate = now + intervalDays * 24 * 60 * 60 * 1000;

  // Record daily activity
  recordDailyActivity();

  return {
    ...card,
    repetitionCount,
    easeFactor,
    intervalDays,
    dueDate: nextDueDate,
    lastReviewedDate: now,
    lastQualityRating: q,
  };
}

/**
 * Get Spaced Repetition global statistics
 */
export function getSM2Stats(): SpacedRepetitionStats {
  const cards = getSM2Cards();
  const now = Date.now();

  const dueToday = cards.filter((c) => c.dueDate <= now);
  const mastered = cards.filter((c) => c.repetitionCount >= 3 && c.easeFactor >= 2.2);
  const learning = cards.filter((c) => c.repetitionCount < 3);

  const totalReviewed = cards.filter((c) => c.lastReviewedDate !== undefined).length;
  const retentionRate = totalReviewed > 0 ? Math.round((mastered.length / Math.max(1, cards.length)) * 100) : 100;

  return {
    totalReviewed,
    retentionRate,
    streakDays: calculateStreak(),
    dueTodayCount: dueToday.length,
    masteredCount: mastered.length,
    learningCount: learning.length,
  };
}

/**
 * Activity log helper
 */
function recordDailyActivity(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(SM2_ACTIVITY_KEY);
    const activity: Record<string, number> = raw ? JSON.parse(raw) : {};
    activity[today] = (activity[today] || 0) + 1;
    localStorage.setItem(SM2_ACTIVITY_KEY, JSON.stringify(activity));
  } catch (e) {}
}

function calculateStreak(): number {
  try {
    const raw = localStorage.getItem(SM2_ACTIVITY_KEY);
    if (!raw) return 1;
    const activity: Record<string, number> = JSON.parse(raw);
    const dates = Object.keys(activity).sort().reverse();
    if (dates.length === 0) return 1;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (activity[dateStr] && activity[dateStr] > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return Math.max(1, streak);
  } catch (e) {
    return 1;
  }
}
