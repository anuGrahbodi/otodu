import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SUBJECTS, updateMastery } from '../data/questions';
import { getSettings } from '../db/dataStore';

const DEFAULT_MASTERY = Object.fromEntries(
  Object.keys(SUBJECTS).map(k => [k, 0.5])
);

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── USER PROFILE ──────────────────────────────
      user: { name: 'Pejuang UTBK', mode: 'speedrun', role: 'student' },
      setMode: (mode) => set(s => ({ user: { ...s.user, mode } })),
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
      mastery: { ...DEFAULT_MASTERY },
      updateSubjectMastery: (subject, isCorrect, reason) =>
        set(s => ({
          mastery: {
            ...s.mastery,
            [subject]: updateMastery(s.mastery[subject] ?? 0.5, isCorrect, reason),
          },
        })),

      // ─── DAILY TARGET ──────────────────────────────
      dailyTarget: { total: 25, completed: 17 },
      addCompleted: (n) =>
        set(s => ({
          dailyTarget: {
            ...s.dailyTarget,
            completed: Math.min(s.dailyTarget.total, s.dailyTarget.completed + n),
          },
        })),

      // ─── SESSIONS / DRAFTS ─────────────────────────
      sessions: [],         // completed sessions
      activeDraft: null,    // { code, subjects, answers, questions, timerEnabled, soalPerMateri, startTime, elapsed }

      createSession: (code, questions, subjects, timerEnabled, soalPerMateri) =>
        set({
          activeDraft: {
            code,
            subjects,
            questions,
            answers: {},    // { questionId: 'A'|'B'|'C'|'D'|'E' }
            ragu: {},        // { questionId: true }
            timerEnabled,
            soalPerMateri,
            startTime: Date.now(),
            elapsed: 0,
          },
        }),

      saveAnswer: (questionId, answer) =>
        set(s => ({
          activeDraft: s.activeDraft
            ? { ...s.activeDraft, answers: { ...s.activeDraft.answers, [questionId]: answer } }
            : s.activeDraft,
        })),

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

      updateElapsed: (elapsed) =>
        set(s => ({
          activeDraft: s.activeDraft ? { ...s.activeDraft, elapsed } : s.activeDraft,
        })),

      // ─── METACOGNITIVE REASONS ─────────────────────
      // { questionId: 'tidak_tau' | 'lupa_rumus' | 'panik' | 'terkecoh' | 'salah_pencet' }
      metacogReasons: {},
      setMetacogReason: (questionId, reason) =>
        set(s => ({ metacogReasons: { ...s.metacogReasons, [questionId]: reason } })),

      // ─── SUBMIT SESSION ────────────────────────────
      submitSession: (metacogReasons) => {
        const draft = get().activeDraft;
        if (!draft) return null;

        const questions = draft.questions;
        const answers = draft.answers;
        const elapsed = Date.now() - draft.startTime;

        let correct = 0;
        const results = questions.map(q => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.answer;
          if (isCorrect) correct++;
          const reason = metacogReasons[q.id] ?? null;
          return { ...q, userAnswer, isCorrect, reason };
        });

        // DINA mastery update
        results.forEach(r => {
          if (!r.isCorrect && r.reason) {
            get().updateSubjectMastery(r.subject, false, r.reason);
          } else if (r.isCorrect) {
            get().updateSubjectMastery(r.subject, true, null);
          }
        });

        // Skill score: base correct% + speed bonus (0-10) + difficulty weighted
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
            completed: Math.min(s.dailyTarget.total, s.dailyTarget.completed + questions.length),
          },
        }));

        return session;
      },

      discardDraft: () => set({ activeDraft: null }),

      getSessionByCode: (code) => get().sessions.find(s => s.code === code),
    }),
    {
      name: 'otoduv3-store',
      partialize: (s) => ({
        user: s.user,
        mastery: s.mastery,
        dailyTarget: s.dailyTarget,
        sessions: s.sessions,
        activeDraft: s.activeDraft,
      }),
    }
  )
);
