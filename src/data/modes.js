export const DAY_KEYS = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

export const DAY_LABELS = {
  minggu: 'Minggu',
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
};

export const MODE_CONFIG = {
  speedrun: {
    id: 'speedrun',
    label: '⚡ Speedrun',
    shortLabel: 'Speedrun',
    completedRequired: 25,
    correctRequired: 15,
    desc: 'Volume tinggi — soal lebih banyak, toleransi jawaban benar lebih rendah.',
    audience:
      'Cocok untuk kamu yang memiliki waktu luang harian lebih sedikit untuk mengerjakan soal UTBK.',
    tooltip:
      'Mode Speedrun: wajib menyelesaikan 25 soal dan minimal 15 jawaban benar. Cocok jika waktu belajarmu terbatas setiap hari.',
    masteryGain: 0.04,
    masteryPenaltyMultiplier: 0.85,
  },
  santai: {
    id: 'santai',
    label: '☕ Santai',
    shortLabel: 'Santai',
    completedRequired: 20,
    correctRequired: 17,
    desc: 'Fokus kualitas — soal lebih sedikit, wajib benar lebih ketat.',
    audience:
      'Cocok untuk kamu yang memiliki waktu luang harian cukup untuk mengerjakan soal UTBK.',
    tooltip:
      'Mode Santai: wajib menyelesaikan 20 soal dan minimal 17 jawaban benar. Cocok jika kamu punya waktu luang harian yang cukup untuk belajar.',
    masteryGain: 0.07,
    masteryPenaltyMultiplier: 1.15,
  },
};

export function getModeConfig(mode) {
  return MODE_CONFIG[mode] ?? MODE_CONFIG.speedrun;
}

export function getTodayDayKey() {
  return DAY_KEYS[new Date().getDay()];
}

export function getDailyTargetRequirements(mode, overrides = {}) {
  const dayKey = getTodayDayKey();
  const override = overrides[dayKey];
  if (override?.completedRequired != null && override?.correctRequired != null) {
    return {
      completedRequired: override.completedRequired,
      correctRequired: override.correctRequired,
    };
  }

  const config = getModeConfig(mode);
  return {
    completedRequired: config.completedRequired,
    correctRequired: config.correctRequired,
  };
}

export function getDayTargetRequirements(mode, dayKey, overrides = {}) {
  const override = overrides[dayKey];
  if (override?.completedRequired != null && override?.correctRequired != null) {
    return {
      completedRequired: override.completedRequired,
      correctRequired: override.correctRequired,
    };
  }

  const config = getModeConfig(mode);
  return {
    completedRequired: config.completedRequired,
    correctRequired: config.correctRequired,
  };
}

export function createDailyTargetState(mode, progress = {}, overrides = {}) {
  const req = getDailyTargetRequirements(mode, overrides);
  return {
    completedRequired: req.completedRequired,
    correctRequired: req.correctRequired,
    completed: progress.completed ?? 0,
    correct: progress.correct ?? 0,
  };
}

export function normalizeDailyTarget(dailyTarget, mode, overrides = {}) {
  const legacyCompleted = dailyTarget?.completed ?? dailyTarget?.total ?? 17;
  const correct = Object.prototype.hasOwnProperty.call(dailyTarget ?? {}, 'correct')
    ? (dailyTarget.correct ?? 0)
    : 3;

  return createDailyTargetState(mode, {
    completed: legacyCompleted,
    correct,
  }, overrides);
}

export function isDailyTargetComplete(dailyTarget) {
  return (
    dailyTarget.completed >= dailyTarget.completedRequired &&
    dailyTarget.correct >= dailyTarget.correctRequired
  );
}

export function getDailyTargetProgress(dailyTarget) {
  const donePct = dailyTarget.completedRequired
    ? Math.round((dailyTarget.completed / dailyTarget.completedRequired) * 100)
    : 0;
  const correctPct = dailyTarget.correctRequired
    ? Math.round((dailyTarget.correct / dailyTarget.correctRequired) * 100)
    : 0;

  return {
    donePct: Math.min(100, donePct),
    correctPct: Math.min(100, correctPct),
    overallPct: Math.min(donePct, correctPct),
  };
}

export function getModeTargetText(mode, dayKey, overrides = {}) {
  const req = dayKey
    ? getDayTargetRequirements(mode, dayKey, overrides)
    : getDailyTargetRequirements(mode, overrides);
  return `${req.completedRequired} soal selesai · ${req.correctRequired} soal benar`;
}
