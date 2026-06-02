import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUBJECTS, updateMastery } from '../data/questions';
import { createDailyTargetState, normalizeDailyTarget, getDailyTargetRequirements } from '../data/modes';
import { getSettings, syncStudentState, saveSessionToDb, saveDraftToDb } from '../db/dataStore';
import { checkAnswer } from '../data/questionTypes';

const DEFAULT_MASTERY = Object.fromEntries(
  Object.keys(SUBJECTS).map(k => [k, 0.5])
);

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── USER PROFILE ──────────────────────────────
      user: { name: 'Pejuang UTBK', mode: 'speedrun', pendingMode: 'speedrun', role: 'student' },
      lastActiveDate: null,

      setUserName: (name) =>
        set(s => ({
          user: { ...s.user, name: name.trim() || s.user.name },
        })),

      scheduleModeChange: (mode) =>
        set(s => ({
          user: { ...s.user, pendingMode: mode },
        })),

      checkDayRollover: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastActiveDate } = get();

        if (!lastActiveDate) {
          set(s => ({
            lastActiveDate: today,
            user: {
              ...s.user,
              pendingMode: s.user.pendingMode ?? s.user.mode,
            },
          }));
          return;
        }

        if (lastActiveDate === today) return;

        const s = get();
        const nextMode = s.user.pendingMode ?? s.user.mode;

        set({
          lastActiveDate: today,
          user: { ...s.user, mode: nextMode, pendingMode: nextMode },
          dailyTarget: createDailyTargetState(nextMode, {}, s.dailyTargetOverrides ?? {}),
        });
      },
      loginAdmin: (password) => {
        const settings = getSettings();
        const correct  = settings?.adminPassword ?? 'admin123';
        if (password === correct) {
          set(s => ({ user: { ...s.user, role: 'admin' } }));
          return true;
        }
        return false;
      },
      logoutAdmin: () => set(s => ({ user: { ...s.user, role: 'student' } })),

      // ─── MASTERY (DINA) ────────────────────────────
      mastery: {
        MATBAS: 0.5,
        LINGPM: 0.5,
        BINDON: 0.5,
        BINGEN: 0.5,
        PPU: 0.5,
        PBM: 0.5,
        PK: 0.5,
      },
      updateSubjectMastery: (subject, isCorrect, reason) =>
        set(s => ({
          mastery: {
            ...s.mastery,
            [subject]: updateMastery(
              s.mastery[subject] ?? 0.5,
              isCorrect,
              reason,
              s.user.mode
            ),
          },
        })),

      // ─── DAILY TARGET ──────────────────────────────
      dailyTarget: createDailyTargetState('speedrun', { completed: 17, correct: 3 }),
      dailyTargetOverrides: {},

      setDailyTargetOverrides: (overrides) => set({ dailyTargetOverrides: overrides }),

      applyTodayTargetRequirements: () => {
        const { user, dailyTarget, dailyTargetOverrides } = get();
        const req = getDailyTargetRequirements(user.mode, dailyTargetOverrides);
        set({
          dailyTarget: {
            ...dailyTarget,
            completedRequired: req.completedRequired,
            correctRequired: req.correctRequired,
          },
        });
      },

      syncDailyTargetFromSettings: () => {
        const { user, dailyTarget, dailyTargetOverrides } = get();
        set({
          dailyTarget: normalizeDailyTarget(dailyTarget, user.mode, dailyTargetOverrides),
        });
      },

      // ─── SESSIONS / DRAFTS ─────────────────────────
      sessions: [],
      activeDraft: null,

      createSession: (code, questions, subjects, timerEnabled, soalPerMateri) => {
        if (get().activeDraft) return;
        const draft = {
          code,
          subjects,
          questions,
          answers: {},
          timeSpent: {},
          ragu: {},
          timerEnabled,
          soalPerMateri,
          startTime: Date.now(),
          elapsed: 0,
        };
        set({ activeDraft: draft });
        saveDraftToDb(draft);
      },

      saveAnswer: (questionId, answer) =>
        set(s => {
          if (!s.activeDraft) return s;
          const draft = { ...s.activeDraft, answers: { ...s.activeDraft.answers, [questionId]: answer } };
          saveDraftToDb(draft);
          return { activeDraft: draft };
        }),

      toggleRagu: (questionId) =>
        set(s => ({
          activeDraft: s.activeDraft
            ? {
                ...s.activeDraft,
                ragu: {
                  ...s.activeDraft.ragu,
                  [questionId]: !s.activeDraft.ragu[questionId],
                },
              }
            : s.activeDraft,
        })),

      updateTimeSpent: (questionId, timeMs) =>
        set(s => {
          if (!s.activeDraft) return s;
          const current = s.activeDraft.timeSpent[questionId] || 0;
          const draft = {
            ...s.activeDraft,
            timeSpent: { ...s.activeDraft.timeSpent, [questionId]: current + timeMs }
          };
          saveDraftToDb(draft);
          return { activeDraft: draft };
        }),

      updateElapsed: (elapsed) =>
        set(s => ({
          activeDraft: s.activeDraft ? { ...s.activeDraft, elapsed } : s.activeDraft,
        })),

      metacogReasons: {},
      setMetacogReason: (questionId, reason) =>
        set(s => ({ metacogReasons: { ...s.metacogReasons, [questionId]: reason } })),

      submitSession: (metacogReasons) => {
        const draft = get().activeDraft;
        if (!draft) return null;

        const questions = draft.questions;
        const answers = draft.answers;
        const timeSpent = draft.timeSpent || {};
        const elapsed = Date.now() - draft.startTime;

        let correct = 0;
        const results = questions.map(q => {
          const userAnswer = answers[q.id];
          const isCorrect = checkAnswer(q, userAnswer);
          if (isCorrect) correct++;
          const reason = metacogReasons[q.id] ?? null;
          const time = timeSpent[q.id] ?? 0;
          return { ...q, userAnswer, isCorrect, reason, timeSpent: time };
        });

        results.forEach(r => {
          if (!r.isCorrect && r.reason) {
            get().updateSubjectMastery(r.subject, false, r.reason);
          } else if (r.isCorrect) {
            get().updateSubjectMastery(r.subject, true, null);
          }
        });

        const avgDiff = questions.reduce((s, q) => s + q.difficulty, 0) / questions.length;
        const correctPct = (correct / questions.length) * 100;
        const speedBonus = draft.timerEnabled
          ? Math.max(0, 10 - Math.floor(elapsed / 60000))
          : 0;
        const skillScore = Math.min(100, Math.round(correctPct * 0.8 + speedBonus * 2 + avgDiff * 2));

        const session = {
          code: draft.code,
          subjects: draft.subjects,
          date: new Date().toISOString(),
          results,
          totalQuestions: questions.length,
          correct,
          elapsed,
          skillScore,
          timerEnabled: draft.timerEnabled,
        };

        set(s => ({
          sessions: [session, ...s.sessions],
          activeDraft: null,
          metacogReasons: {},
          dailyTarget: {
            ...s.dailyTarget,
            completed: s.dailyTarget.completed + questions.length,
            correct: s.dailyTarget.correct + correct,
          },
        }));

        saveSessionToDb(session);
        saveDraftToDb(null);
        syncStudentState(get());

        return session;
      },

      discardDraft: () => {
        set({ activeDraft: null });
        saveDraftToDb(null);
      },

      getSessionByCode: (code) => get().sessions.find(s => s.code === code),
    }),
    {
      name: 'otoduv3-store',
      version: 4,
      migrate: (state, fromVersion) => {
        const mode = state?.user?.mode ?? 'speedrun';
        const overrides = state?.dailyTargetOverrides ?? {};

        if (fromVersion < 3) {
          return {
            ...state,
            dailyTargetOverrides: overrides,
            dailyTarget: createDailyTargetState(mode, { completed: 17, correct: 3 }, overrides),
          };
        }

        return {
          ...state,
          dailyTargetOverrides: overrides,
          dailyTarget: normalizeDailyTarget(state?.dailyTarget, mode, overrides),
        };
      },
      partialize: (s) => ({
        user: s.user,
        mastery: s.mastery,
        dailyTarget: s.dailyTarget,
        dailyTargetOverrides: s.dailyTargetOverrides,
        sessions: s.sessions,
        activeDraft: s.activeDraft,
        lastActiveDate: s.lastActiveDate,
      }),
    }
  )
);
