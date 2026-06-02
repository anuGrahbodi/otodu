/** Tipe soal resmi UTBK/SNBT (2024+) */
export const QUESTION_TYPES = {
  pg: {
    id: 'pg',
    label: 'Pilihan Ganda',
    shortLabel: 'PG',
    icon: '🔘',
    desc: 'Satu jawaban benar dari lima opsi (A–E).',
  },
  pmk: {
    id: 'pmk',
    label: 'Pilihan Majemuk Kompleks',
    shortLabel: 'PMK',
    icon: '☑️',
    desc: 'Beberapa pernyataan; tentukan Benar/Salah untuk masing-masing.',
  },
  is: {
    id: 'is',
    label: 'Isian Singkat',
    shortLabel: 'IS',
    icon: '✏️',
    desc: 'Jawaban singkat (angka/kata/simbol) tanpa opsi pilihan.',
  },
};

/** Subtes UTBK/SNBT */
export const SUBTESTS = {
  PU:  { id: 'PU',  label: 'Penalaran Umum' },
  PPU: { id: 'PPU', label: 'Pemahaman Bacaan & Menulis' },
  PK:  { id: 'PK',  label: 'Pengetahuan Kuantitatif' },
  LBI: { id: 'LBI', label: 'Literasi Bahasa Indonesia' },
  LBE: { id: 'LBE', label: 'Literasi Bahasa Inggris' },
  PM:  { id: 'PM',  label: 'Penalaran Matematika' },
};

const SUBJECT_TO_SUBTEST = {
  LINGPM: 'PU',
  PPU: 'PPU',
  PBM: 'PK',
  MATBAS: 'PM',
  BINDON: 'LBI',
  BINGEN: 'LBE',
};

export function inferSubtest(subject) {
  return SUBJECT_TO_SUBTEST[subject] ?? 'PU';
}

export function getQuestionTypeConfig(type) {
  return QUESTION_TYPES[type] ?? QUESTION_TYPES.pg;
}

export function normalizeQuestion(q) {
  const type = q.questionType ?? 'pg';
  const base = {
    ...q,
    questionType: type,
    subtest: q.subtest ?? inferSubtest(q.subject),
    isActive: q.isActive !== false,
    source: q.source ?? '',
    year: q.year ?? null,
    dinaSlip: q.dinaSlip ?? 0.1,
    dinaGuess: q.dinaGuess ?? 0.25,
    communityStats: q.communityStats ?? { correctRate: 0.5, ontimeRate: 0.5 },
    distractorAnalysis: q.distractorAnalysis ?? {},
    tags: q.tags ?? [],
    answerVariants: q.answerVariants ?? [],
    idealTime: q.idealTime ?? 90,
  };

  if (type === 'is') {
    return {
      ...base,
      options: [],
      answer: typeof q.answer === 'string' ? q.answer : String(q.answer ?? ''),
      statements: [],
    };
  }

  if (type === 'pmk') {
    const statements = q.statements?.length
      ? q.statements
      : ['Pernyataan (1)', 'Pernyataan (2)'];
    const answer = Array.isArray(q.answer)
      ? q.answer
      : statements.map(() => 'Benar');
    return {
      ...base,
      statements,
      answer,
      options: [],
    };
  }

  return {
    ...base,
    options: q.options?.length === 5
      ? q.options
      : ['A. ', 'B. ', 'C. ', 'D. ', 'E. '],
    answer: typeof q.answer === 'string' ? q.answer : 'A',
    statements: [],
  };
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function checkAnswer(question, userAnswer) {
  const q = normalizeQuestion(question);
  const type = q.questionType;

  if (type === 'is') {
    if (userAnswer == null || userAnswer === '') return false;
    const accepted = [q.answer, ...(q.answerVariants ?? [])].map(normalizeText);
    return accepted.includes(normalizeText(userAnswer));
  }

  if (type === 'pmk') {
    if (!Array.isArray(userAnswer) || !Array.isArray(q.answer)) return false;
    if (userAnswer.length !== q.answer.length) return false;
    return userAnswer.every((val, i) => val === q.answer[i]);
  }

  return userAnswer === q.answer;
}

export function formatAnswerDisplay(question) {
  const q = normalizeQuestion(question);

  if (q.questionType === 'is') {
    return q.answer;
  }

  if (q.questionType === 'pmk') {
    return q.statements
      .map((stmt, i) => `${i + 1}. ${stmt} → ${q.answer[i] ?? '-'}`)
      .join(' · ');
  }

  return q.answer;
}

export function formatUserAnswerDisplay(question, userAnswer) {
  if (userAnswer == null || userAnswer === '') return '(Tidak dijawab)';

  const q = normalizeQuestion(question);

  if (q.questionType === 'pmk' && Array.isArray(userAnswer)) {
    return userAnswer
      .map((val, i) => `${i + 1}. ${val ?? '-'}`)
      .join(' · ');
  }

  return String(userAnswer);
}

export function isAnswered(question, userAnswer) {
  const q = normalizeQuestion(question);

  if (q.questionType === 'pmk') {
    return Array.isArray(userAnswer)
      && userAnswer.length === q.statements.length
      && userAnswer.every(v => v === 'Benar' || v === 'Salah');
  }

  if (q.questionType === 'is') {
    return String(userAnswer ?? '').trim().length > 0;
  }

  return !!userAnswer;
}

export const EMPTY_QUESTION = {
  id: '',
  subject: 'MATBAS',
  subtest: 'PM',
  questionType: 'pg',
  difficulty: 1,
  idealTime: 90,
  dinaSlip: 0.1,
  dinaGuess: 0.25,
  stimulus: '',
  question: '',
  options: ['A. ', 'B. ', 'C. ', 'D. ', 'E. '],
  statements: ['', ''],
  answer: 'A',
  answerVariants: [],
  explanation: '',
  tags: [],
  source: '',
  year: null,
  isActive: true,
  communityStats: { correctRate: 0.5, ontimeRate: 0.5 },
  distractorAnalysis: {},
};
