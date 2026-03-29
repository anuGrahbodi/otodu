/**
 * ─── DATA STORE (src/db/dataStore.js) ───────────────────────────────────────
 * Sumber satu-satunya kebenaran data aplikasi OTODUv3.
 * - Membaca data awal dari src/db/questions.json & src/db/appData.json
 * - Menyimpan perubahan di localStorage (simulasi database lokal)
 * - Admin dapat mengubah data via AdminDashboard, perubahan tersimpan di sini
 *
 * VERSI DATA:
 * Setiap kali questions.json / appData.json diubah, naikkan DB_VERSION
 * agar localStorage direset otomatis saat pengguna membuka aplikasi.
 */

import rawQuestions from './questions.json';
import rawAppData   from './appData.json';

const DB_VERSION   = '3';          // ← naikan angka ini setiap update JSON
const LS_QUESTIONS = 'otoduv3-db-questions';
const LS_APPDATA   = 'otoduv3-db-appdata';
const LS_VERSION   = 'otoduv3-db-version';

// ─── Bootstrap: isi localStorage dari JSON, reset jika versi beda ──────────
function bootstrap() {
  const savedVersion = localStorage.getItem(LS_VERSION);
  if (savedVersion !== DB_VERSION) {
    // Data seed berubah → reset semua ke JSON terbaru
    localStorage.setItem(LS_QUESTIONS, JSON.stringify(rawQuestions));
    localStorage.setItem(LS_APPDATA,   JSON.stringify(rawAppData));
    localStorage.setItem(LS_VERSION,   DB_VERSION);
    return;
  }
  // Versi sama: isi hanya jika belum ada (first visit)
  if (!localStorage.getItem(LS_QUESTIONS)) {
    localStorage.setItem(LS_QUESTIONS, JSON.stringify(rawQuestions));
  }
  if (!localStorage.getItem(LS_APPDATA)) {
    localStorage.setItem(LS_APPDATA, JSON.stringify(rawAppData));
  }
}
bootstrap();

// ─────────────────── QUESTIONS ─────────────────────────────────────────────

export function getQuestions() {
  try {
    return JSON.parse(localStorage.getItem(LS_QUESTIONS)) || rawQuestions;
  } catch { return rawQuestions; }
}

export function saveQuestions(questions) {
  localStorage.setItem(LS_QUESTIONS, JSON.stringify(questions));
}

export function addQuestion(q) {
  const qs = getQuestions();
  qs.push(q);
  saveQuestions(qs);
}

export function updateQuestion(updatedQ) {
  const qs = getQuestions().map(q => q.id === updatedQ.id ? updatedQ : q);
  saveQuestions(qs);
}

export function deleteQuestion(id) {
  saveQuestions(getQuestions().filter(q => q.id !== id));
}

// ─────────────────── APP DATA ──────────────────────────────────────────────

export function getAppData() {
  try {
    return JSON.parse(localStorage.getItem(LS_APPDATA)) || rawAppData;
  } catch { return rawAppData; }
}

export function saveAppData(data) {
  localStorage.setItem(LS_APPDATA, JSON.stringify(data));
}

// ─── Settings ──────────────────────────────────────────────────────────────
export function getSettings() {
  return getAppData().siteSettings;
}
export function saveSettings(settings) {
  const d = getAppData();
  d.siteSettings = { ...d.siteSettings, ...settings };
  saveAppData(d);
}

// ─── Community Stats ───────────────────────────────────────────────────────
export function getCommunityStats() {
  return getAppData().communityStats;
}
export function saveCommunityStats(stats) {
  const d = getAppData();
  d.communityStats = { ...d.communityStats, ...stats };
  saveAppData(d);
}

// ─── Ticker messages ───────────────────────────────────────────────────────
export function getRawTickerMessages() {
  return getAppData().tickerMessages;
}
export function getTickerMessages() {
  const { tickerMessages, communityStats } = getAppData();
  // Replace template placeholders with actual values
  return tickerMessages.map(msg =>
    msg.replace(/\{(\w+)\}/g, (_, key) => communityStats[key] ?? `{${key}}`)
  );
}
export function saveTickerMessages(messages) {
  const d = getAppData();
  d.tickerMessages = messages;
  saveAppData(d);
}

// ─── Tryout packages ───────────────────────────────────────────────────────
export function getTryoutPackages() {
  return getAppData().tryoutPackages;
}
export function saveTryoutPackages(packages) {
  const d = getAppData();
  d.tryoutPackages = packages;
  saveAppData(d);
}
export function addTryoutPackage(pkg) {
  const d = getAppData();
  d.tryoutPackages.push(pkg);
  saveAppData(d);
}
export function updateTryoutPackage(updated) {
  const d = getAppData();
  d.tryoutPackages = d.tryoutPackages.map(p => p.id === updated.id ? updated : p);
  saveAppData(d);
}
export function deleteTryoutPackage(id) {
  const d = getAppData();
  d.tryoutPackages = d.tryoutPackages.filter(p => p.id !== id);
  saveAppData(d);
}

// ─── Users ─────────────────────────────────────────────────────────────────
export function getUsers() {
  return getAppData().users;
}
export function updateUser(updated) {
  const d = getAppData();
  d.users = d.users.map(u => u.id === updated.id ? updated : u);
  saveAppData(d);
}
export function deleteUser(id) {
  const d = getAppData();
  d.users = d.users.filter(u => u.id !== id);
  saveAppData(d);
}

// ─── Activity log ──────────────────────────────────────────────────────────
export function getActivityLog() {
  return getAppData().activityLog;
}
export function addActivityLog(entry) {
  const d = getAppData();
  d.activityLog = [entry, ...d.activityLog].slice(0, 50); // max 50 entries
  saveAppData(d);
}

// ─── Helper: questions by subjects (used by exam engine) ───────────────────
export function getQuestionsBySubjects(subjectKeys, count = 5) {
  const questions = getQuestions();
  const result = [];
  subjectKeys.forEach(key => {
    const subjectQs = questions
      .filter(q => q.subject === key)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    result.push(...subjectQs);
  });
  return result;
}

// ─── Reset ke data awal (admin action) ────────────────────────────────────
export function resetToDefaults() {
  localStorage.setItem(LS_QUESTIONS, JSON.stringify(rawQuestions));
  localStorage.setItem(LS_APPDATA,   JSON.stringify(rawAppData));
  localStorage.setItem(LS_VERSION,   DB_VERSION);
}
