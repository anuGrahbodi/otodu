import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.postgresql.sql');

const { Pool } = pg;

const isRemoteDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://otodu:otodu123@localhost:5432/otodu',
  ...(isRemoteDb && { ssl: { rejectUnauthorized: false } })
});

export const DEFAULT_STUDENT_ID = 'local-default';

export function getPool() {
  return pool;
}

export async function query(text, params) {
  return pool.query(text, params);
}

export async function initDb() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  await pool.query(schema);
}

function parseJsonField(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function rowToQuestion(row) {
  if (!row) return null;
  const type = row.question_type_id;
  let answer = row.answer;
  if (type === 'pmk') {
    answer = parseJsonField(answer, []);
    if (typeof answer === 'string') {
      try { answer = JSON.parse(answer); } catch { answer = []; }
    }
  }
  return {
    id: row.id,
    subject: row.subject_id,
    subtest: row.subtest_id,
    questionType: type,
    difficulty: row.difficulty,
    dinaSlip: row.dina_slip,
    dinaGuess: row.dina_guess,
    stimulus: row.stimulus,
    question: row.question_text,
    explanation: row.explanation,
    answer,
    answerVariants: parseJsonField(row.answer_variants, []),
    options: parseJsonField(row.options, []),
    statements: parseJsonField(row.statements, []),
    distractorAnalysis: parseJsonField(row.distractor_analysis, {}),
    communityStats: parseJsonField(row.community_stats, {}),
    tags: parseJsonField(row.tags, []),
    source: row.source || '',
    year: row.year_ref,
    isActive: !!row.is_active,
  };
}

export function questionToRow(q) {
  const type = q.questionType ?? 'pg';
  return {
    id: q.id,
    subject_id: q.subject,
    subtest_id: q.subtest,
    question_type_id: type,
    difficulty: q.difficulty ?? 1,
    dina_slip: q.dinaSlip ?? 0.1,
    dina_guess: q.dinaGuess ?? 0.25,
    stimulus: q.stimulus ?? null,
    question_text: q.question,
    explanation: q.explanation ?? '',
    answer: type === 'pmk' ? JSON.stringify(q.answer ?? []) : String(q.answer ?? ''),
    answer_variants: JSON.stringify(q.answerVariants ?? []),
    options: JSON.stringify(q.options ?? []),
    statements: JSON.stringify(q.statements ?? []),
    distractor_analysis: JSON.stringify(q.distractorAnalysis ?? {}),
    community_stats: JSON.stringify(q.communityStats ?? { correctRate: 0.5, ontimeRate: 0.5 }),
    tags: JSON.stringify(q.tags ?? []),
    source: q.source ?? '',
    year_ref: q.year ?? null,
    is_active: q.isActive !== false,
  };
}

export async function closeDb() {
  await pool.end();
}
