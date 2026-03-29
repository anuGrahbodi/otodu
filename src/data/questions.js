/**
 * src/data/questions.js
 * Re-exports dari dataStore agar komponen lama tetap bisa import dari sini.
 * Sumber data yang sebenarnya ada di src/db/dataStore.js
 */

export { getQuestions as questions, getQuestionsBySubjects } from '../db/dataStore';

// Re-export SUBJECTS (static, tidak perlu disimpan)
export const SUBJECTS = {
  MATBAS: { label: 'Matematika Dasar',           code: 'MAT', icon: '📐', color: '#0ea5e9' },
  LINGPM: { label: 'Penalaran Umum',              code: 'PU',  icon: '🧩', color: '#8b5cf6' },
  BINDON: { label: 'Bahasa Indonesia',            code: 'BIN', icon: '📖', color: '#10b981' },
  BINGEN: { label: 'Bahasa Inggris',             code: 'ENG', icon: '🌐', color: '#f59e0b' },
  PPU:    { label: 'Pemahaman Bacaan & Menulis',  code: 'PPU', icon: '✍️',  color: '#ef4444' },
  PBM:    { label: 'Pengetahuan Kuantitatif',     code: 'PBM', icon: '🔢', color: '#06b6d4' },
};

export function generateDraftCode(subjectKeys) {
  const mapelCode = subjectKeys.map(k => SUBJECTS[k]?.code || k).join('');
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(2);
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const dd  = String(now.getDate()).padStart(2, '0');
  const hh  = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const sessionNum = Math.floor(100000 + Math.random() * 900000);
  return `${mapelCode}.${yy}${mm}${dd}.${hh}${min}${ss}${sessionNum}TODU`;
}

export function updateMastery(currentMastery, isCorrect, reason) {
  const penalty = { tidak_tau: 0.15, lupa_rumus: 0.08, panik: 0.04, terkecoh: 0.10, salah_pencet: 0.02 };
  if (isCorrect) return Math.min(1, currentMastery + 0.06 * (1 - currentMastery));
  const p = penalty[reason] ?? 0.08;
  return Math.max(0, currentMastery - p);
}
