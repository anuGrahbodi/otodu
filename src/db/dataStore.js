/**
 * ─── DATA STORE ─────────────────────────────────────────────────────────────
 * Lapisan akses data OTODU. Prioritas: SQLite API → cache memori → localStorage.
 */

import rawQuestions from './questions.json';
import rawAppData from './appData.json';
import { normalizeQuestion } from '../data/questionTypes';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DB_VERSION = '5';
const LS_QUESTIONS = 'otoduv3-db-questions';
const LS_APPDATA = 'otoduv3-db-appdata';
const LS_VERSION = 'otoduv3-db-version';

let useApi = false;
let ready = false;
let readyPromise = null;

const cache = {
  questions: [],
  appData: { ...rawAppData },
};

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

function bootstrapLocal() {
  const savedVersion = localStorage.getItem(LS_VERSION);
  if (savedVersion !== DB_VERSION) {
    localStorage.setItem(LS_QUESTIONS, JSON.stringify(rawQuestions));
    localStorage.setItem(LS_APPDATA, JSON.stringify(rawAppData));
    localStorage.setItem(LS_VERSION, DB_VERSION);
  } else {
    if (!localStorage.getItem(LS_QUESTIONS)) {
      localStorage.setItem(LS_QUESTIONS, JSON.stringify(rawQuestions));
    }
    if (!localStorage.getItem(LS_APPDATA)) {
      localStorage.setItem(LS_APPDATA, JSON.stringify(rawAppData));
    }
  }
  cache.questions = getQuestionsFromLS();
  cache.appData = getAppDataFromLS();
}

function getQuestionsFromLS() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_QUESTIONS)) || rawQuestions;
    return raw.map(normalizeQuestion);
  } catch {
    return rawQuestions.map(normalizeQuestion);
  }
}

function getAppDataFromLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_APPDATA)) || rawAppData;
  } catch {
    return rawAppData;
  }
}

function persistLocalQuestions(questions) {
  localStorage.setItem(LS_QUESTIONS, JSON.stringify(questions.map(normalizeQuestion)));
  cache.questions = questions.map(normalizeQuestion);
}

function persistLocalAppData(data) {
  localStorage.setItem(LS_APPDATA, JSON.stringify(data));
  cache.appData = data;
}

async function loadFromApi() {
  const [questions, settings, stats, tickers, tryouts, users, log] = await Promise.all([
    apiFetch('/questions?includeInactive=true'),
    apiFetch('/settings'),
    apiFetch('/community-stats'),
    apiFetch('/ticker-messages'),
    apiFetch('/tryout-packages'),
    apiFetch('/users'),
    apiFetch('/activity-log'),
  ]);

  cache.questions = questions.map(normalizeQuestion);
  cache.appData = {
    siteSettings: settings,
    communityStats: stats,
    tickerMessages: tickers,
    tryoutPackages: tryouts,
    users,
    activityLog: log,
  };

  localStorage.setItem(LS_QUESTIONS, JSON.stringify(cache.questions));
  localStorage.setItem(LS_APPDATA, JSON.stringify(cache.appData));
  localStorage.setItem(LS_VERSION, DB_VERSION);
}

/** Panggil sekali saat app boot — menunggu koneksi API jika tersedia */
export function initDataStore() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    bootstrapLocal();
    try {
      await apiFetch('/health');
      useApi = true;
      await loadFromApi();
      console.info('[OTODU] Database PostgreSQL terhubung via API');
    } catch {
      useApi = false;
      console.warn('[OTODU] API tidak tersedia — fallback localStorage');
    }
    ready = true;
  })();
  return readyPromise;
}

export function isDataStoreReady() {
  return ready;
}

export function isUsingApi() {
  return useApi;
}

// ─────────────────── QUESTIONS ─────────────────────────────────────────────

export function getQuestions({ includeInactive = true } = {}) {
  const qs = cache.questions.length ? cache.questions : getQuestionsFromLS();
  return includeInactive ? qs : qs.filter(q => q.isActive);
}

export function saveQuestions(questions) {
  persistLocalQuestions(questions);
  if (useApi) {
    Promise.all(questions.map(q =>
      apiFetch(`/questions/${q.id}`, { method: 'PUT', body: JSON.stringify(q) }).catch(() =>
        apiFetch('/questions', { method: 'POST', body: JSON.stringify(q) })
      )
    )).catch(console.error);
  }
}

export function addQuestion(q) {
  const normalized = normalizeQuestion(q);
  persistLocalQuestions([...getQuestions(), normalized]);
  if (useApi) {
    apiFetch('/questions', { method: 'POST', body: JSON.stringify(normalized) }).catch(console.error);
  }
}

export function updateQuestion(updatedQ) {
  const normalized = normalizeQuestion(updatedQ);
  persistLocalQuestions(getQuestions().map(q => q.id === normalized.id ? normalized : q));
  if (useApi) {
    apiFetch(`/questions/${normalized.id}`, { method: 'PUT', body: JSON.stringify(normalized) }).catch(console.error);
  }
}

export function deleteQuestion(id) {
  persistLocalQuestions(getQuestions().filter(q => q.id !== id));
  if (useApi) {
    apiFetch(`/questions/${id}`, { method: 'DELETE' }).catch(console.error);
  }
}

// ─────────────────── APP DATA ──────────────────────────────────────────────

export function getAppData() {
  return cache.appData.siteSettings ? cache.appData : getAppDataFromLS();
}

export function saveAppData(data) {
  persistLocalAppData(data);
}

export function getSettings() {
  return getAppData().siteSettings;
}

export function saveSettings(settings) {
  const d = getAppData();
  d.siteSettings = { ...d.siteSettings, ...settings };
  persistLocalAppData(d);
  if (useApi) {
    apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(settings) }).catch(console.error);
  }
}

export function getCommunityStats() {
  return getAppData().communityStats;
}

export function saveCommunityStats(stats) {
  const d = getAppData();
  d.communityStats = { ...d.communityStats, ...stats };
  persistLocalAppData(d);
  if (useApi) {
    apiFetch('/community-stats', { method: 'PATCH', body: JSON.stringify(stats) }).catch(console.error);
  }
}

export function getRawTickerMessages() {
  return getAppData().tickerMessages;
}

export function getTickerMessages() {
  const { tickerMessages, communityStats } = getAppData();
  return tickerMessages.map(msg =>
    msg.replace(/\{(\w+)\}/g, (_, key) => communityStats[key] ?? `{${key}}`)
  );
}

export function saveTickerMessages(messages) {
  const d = getAppData();
  d.tickerMessages = messages;
  persistLocalAppData(d);
  if (useApi) {
    apiFetch('/ticker-messages', { method: 'PUT', body: JSON.stringify({ messages }) }).catch(console.error);
  }
}

export function getTryoutPackages() {
  return getAppData().tryoutPackages;
}

export function saveTryoutPackages(packages) {
  const d = getAppData();
  d.tryoutPackages = packages;
  persistLocalAppData(d);
}

export function addTryoutPackage(pkg) {
  const d = getAppData();
  d.tryoutPackages.push(pkg);
  persistLocalAppData(d);
  if (useApi) {
    apiFetch('/tryout-packages', { method: 'POST', body: JSON.stringify(pkg) }).catch(console.error);
  }
}

export function updateTryoutPackage(updated) {
  const d = getAppData();
  d.tryoutPackages = d.tryoutPackages.map(p => p.id === updated.id ? updated : p);
  persistLocalAppData(d);
  if (useApi) {
    apiFetch(`/tryout-packages/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) }).catch(console.error);
  }
}

export function deleteTryoutPackage(id) {
  const d = getAppData();
  d.tryoutPackages = d.tryoutPackages.filter(p => p.id !== id);
  persistLocalAppData(d);
  if (useApi) {
    apiFetch(`/tryout-packages/${id}`, { method: 'DELETE' }).catch(console.error);
  }
}

export function getUsers() {
  return getAppData().users;
}

export function updateUser(updated) {
  const d = getAppData();
  d.users = d.users.map(u => u.id === updated.id ? updated : u);
  persistLocalAppData(d);
  if (useApi) {
    apiFetch(`/users/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) }).catch(console.error);
  }
}

export function deleteUser(id) {
  const d = getAppData();
  d.users = d.users.filter(u => u.id !== id);
  persistLocalAppData(d);
  if (useApi) {
    apiFetch(`/users/${id}`, { method: 'DELETE' }).catch(console.error);
  }
}

export function getActivityLog() {
  return getAppData().activityLog;
}

export function addActivityLog(entry) {
  const d = getAppData();
  d.activityLog = [entry, ...d.activityLog].slice(0, 50);
  persistLocalAppData(d);
  if (useApi) {
    apiFetch('/activity-log', { method: 'POST', body: JSON.stringify(entry) }).catch(console.error);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

export function distributeSoalCounts(total, subjectCount) {
  if (subjectCount <= 0) return [];
  const base = Math.floor(total / subjectCount);
  const remainder = total % subjectCount;
  return Array.from({ length: subjectCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function getQuestionsBySubjects(subjectKeys, count = 5) {
  const questions = getQuestions({ includeInactive: false });
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

// Target Difficulty Mapping
function getTargetDifficulty(mastery) {
  if (mastery < 0.4) return 1; // Mudah
  if (mastery > 0.7) return 3; // Sulit
  return 2; // Sedang
}

// ─── Adaptive Question Selection Engine ─────────────────────────────────────
export function getAdaptiveQuestions(subjectKeys, totalCount, studentState) {
  if (subjectKeys.length === 0 || totalCount <= 0) return [];
  const counts = distributeSoalCounts(totalCount, subjectKeys.length);
  const allQuestions = getQuestions({ includeInactive: false });
  const result = [];

  // Fallback if no student state is provided (e.g., guest mode)
  if (!studentState) {
    return getQuestionsBySubjectsTotal(subjectKeys, totalCount);
  }

  const { mastery = {}, questionHistory = {} } = studentState;

  subjectKeys.forEach((key, i) => {
    const subjMastery = mastery[key] ?? 0.5;
    // We mock avgTimeSpent to 90s if not tracked yet per subject, in reality it should come from aggregated history
    const userAvgTime = 90; 
    const targetDiff = getTargetDifficulty(subjMastery);
    const countNeeded = counts[i];

    let scoredQuestions = allQuestions
      .filter(q => q.subject === key)
      .map(q => {
        let score = 0;

        // A. Difficulty Match (30%)
        if (q.difficulty === targetDiff) score += 30;
        else if (Math.abs(q.difficulty - targetDiff) === 1) score += 10;

        // B. Time-on-Task Match (20%)
        const timeRatio = userAvgTime / (q.idealTime || 90);
        const timeScore = Math.max(0, 20 - Math.abs(1 - timeRatio) * 10);
        score += timeScore;

        // C. Freshness (40%)
        const history = questionHistory[q.id];
        if (!history) {
          score += 40; // Never seen
        } else {
          const daysSince = (Date.now() - new Date(history.lastSeen).getTime()) / 86400000;
          if (history.isCorrect && daysSince < 7) {
            score += 0; // Don't repeat recent correct answers
          } else if (!history.isCorrect) {
            score += 25; // Remedial: previously wrong
          } else {
            score += Math.min(40, daysSince * 2); // Decay factor
          }
        }

        // D. Random Factor (10%)
        score += Math.random() * 10;

        return { question: q, score };
      });

    // Sort by score descending and take top N
    scoredQuestions.sort((a, b) => b.score - a.score);
    let selectedQs = scoredQuestions.slice(0, countNeeded).map(sq => sq.question);
    
    // Shuffle the final selection for this subject to remove predictability
    selectedQs.sort(() => Math.random() - 0.5);
    
    result.push(...selectedQs);
  });

  return result;
}

export function getQuestionsBySubjectsTotal(subjectKeys, totalCount) {
  if (subjectKeys.length === 0 || totalCount <= 0) return [];
  const counts = distributeSoalCounts(totalCount, subjectKeys.length);
  const questions = getQuestions({ includeInactive: false });
  const result = [];
  subjectKeys.forEach((key, i) => {
    const subjectQs = questions
      .filter(q => q.subject === key)
      .sort(() => Math.random() - 0.5)
      .slice(0, counts[i]);
    result.push(...subjectQs);
  });
  return result;
}

export async function resetToDefaults() {
  if (useApi) {
    await apiFetch('/reset', { method: 'POST' });
    await loadFromApi();
  } else {
    localStorage.setItem(LS_QUESTIONS, JSON.stringify(rawQuestions));
    localStorage.setItem(LS_APPDATA, JSON.stringify(rawAppData));
    localStorage.setItem(LS_VERSION, DB_VERSION);
    cache.questions = rawQuestions.map(normalizeQuestion);
    cache.appData = { ...rawAppData };
  }
}

// ─── Student sync (profil + sesi) ───────────────────────────────────────────

export async function syncStudentState(state) {
  if (!useApi) return;
  await apiFetch('/students/default', {
    method: 'PUT',
    body: JSON.stringify({
      user: state.user,
      lastActiveDate: state.lastActiveDate,
      mastery: state.mastery,
      dailyTarget: state.dailyTarget,
      dailyTargetOverrides: state.dailyTargetOverrides,
    }),
  });
}

export async function saveSessionToDb(session) {
  if (!useApi) return;
  await apiFetch('/students/default/sessions', { method: 'POST', body: JSON.stringify(session) });
}

export async function saveDraftToDb(draft) {
  if (!useApi) return;
  if (draft) {
    await apiFetch('/students/default/draft', { method: 'PUT', body: JSON.stringify(draft) });
  } else {
    await apiFetch('/students/default/draft', { method: 'DELETE' });
  }
}

bootstrapLocal();
