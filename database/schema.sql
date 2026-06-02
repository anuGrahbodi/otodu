-- OTODU — Schema SQLite (legacy, tidak dipakai lagi)
-- Database aktif: PostgreSQL → lihat schema.postgresql.sql

PRAGMA foreign_keys = ON;

-- ─── Referensi statis ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  code        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '📘',
  color       TEXT NOT NULL DEFAULT '#0ea5e9'
);

CREATE TABLE IF NOT EXISTS subtests (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_types (
  id            TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  short_label   TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT '🔘',
  description   TEXT NOT NULL DEFAULT ''
);

-- ─── Bank soal ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS questions (
  id                  TEXT PRIMARY KEY,
  subject_id          TEXT NOT NULL REFERENCES subjects(id),
  subtest_id          TEXT NOT NULL REFERENCES subtests(id),
  question_type_id    TEXT NOT NULL DEFAULT 'pg' REFERENCES question_types(id),
  difficulty          INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  dina_slip           REAL NOT NULL DEFAULT 0.1,
  dina_guess          REAL NOT NULL DEFAULT 0.25,
  stimulus            TEXT,
  question_text       TEXT NOT NULL,
  explanation         TEXT NOT NULL DEFAULT '',
  answer              TEXT NOT NULL,           -- PG: huruf | IS: teks | PMK: JSON array
  answer_variants     TEXT NOT NULL DEFAULT '[]', -- JSON array (IS)
  options             TEXT NOT NULL DEFAULT '[]', -- JSON array (PG)
  statements          TEXT NOT NULL DEFAULT '[]', -- JSON array (PMK)
  distractor_analysis TEXT NOT NULL DEFAULT '{}', -- JSON object (PG)
  community_stats     TEXT NOT NULL DEFAULT '{"correctRate":0.5,"ontimeRate":0.5}',
  tags                TEXT NOT NULL DEFAULT '[]',
  source              TEXT NOT NULL DEFAULT '',
  year_ref            INTEGER,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_subtest ON questions(subtest_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type_id);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

-- ─── Pengaturan global (singleton) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_settings (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),
  app_name              TEXT NOT NULL DEFAULT 'OTODUv3',
  tagline               TEXT NOT NULL DEFAULT '',
  utbk_date             TEXT NOT NULL,
  admin_password        TEXT NOT NULL DEFAULT 'admin123',
  scoring_method        TEXT NOT NULL DEFAULT 'irt' CHECK (scoring_method IN ('irt', 'klasik')),
  proctor_enabled       INTEGER NOT NULL DEFAULT 1,
  registration_open     INTEGER NOT NULL DEFAULT 1,
  daily_target_default  INTEGER NOT NULL DEFAULT 25,
  soal_per_materi_default INTEGER NOT NULL DEFAULT 5,
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS community_stats (
  id                            INTEGER PRIMARY KEY CHECK (id = 1),
  total_users                   INTEGER NOT NULL DEFAULT 0,
  total_questions               INTEGER NOT NULL DEFAULT 0,
  total_sessions_all_time       INTEGER NOT NULL DEFAULT 0,
  sessions_today                INTEGER NOT NULL DEFAULT 0,
  users_completed_target_today  INTEGER NOT NULL DEFAULT 0,
  soal_dikerjakan_jam_ini       INTEGER NOT NULL DEFAULT 0,
  avg_score_community           REAL NOT NULL DEFAULT 0,
  top_subject_struggle          TEXT NOT NULL DEFAULT '',
  top_subject_struggle_correct_rate REAL NOT NULL DEFAULT 0,
  users_improved_pu_this_week   INTEGER NOT NULL DEFAULT 0,
  top_performer_threshold       INTEGER NOT NULL DEFAULT 0,
  updated_at                    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ticker_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  message     TEXT NOT NULL
);

-- ─── Tryout & admin ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tryout_packages (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'aktif', 'selesai')),
  participants    INTEGER NOT NULL DEFAULT 0,
  soal_per_materi INTEGER NOT NULL DEFAULT 10,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tryout_package_subjects (
  package_id  TEXT NOT NULL REFERENCES tryout_packages(id) ON DELETE CASCADE,
  subject_id  TEXT NOT NULL REFERENCES subjects(id),
  PRIMARY KEY (package_id, subject_id)
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'siswa' CHECK (role IN ('siswa', 'editor', 'admin')),
  subscription  TEXT NOT NULL DEFAULT 'gratis' CHECK (subscription IN ('gratis', 'premium')),
  last_login    TEXT NOT NULL DEFAULT '',
  join_date     TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('system', 'content', 'user')),
  message     TEXT NOT NULL,
  timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_log_ts ON activity_log(timestamp DESC);

-- ─── Profil siswa (perangkat / akun lokal) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS students (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT 'Pejuang UTBK',
  mode            TEXT NOT NULL DEFAULT 'speedrun' CHECK (mode IN ('speedrun', 'santai')),
  pending_mode    TEXT NOT NULL DEFAULT 'speedrun' CHECK (pending_mode IN ('speedrun', 'santai')),
  role            TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  last_active_date TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_mastery (
  student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id   TEXT NOT NULL REFERENCES subjects(id),
  value        REAL NOT NULL DEFAULT 0.5 CHECK (value >= 0 AND value <= 1),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS student_daily_targets (
  student_id          TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  completed_required  INTEGER NOT NULL DEFAULT 25,
  correct_required    INTEGER NOT NULL DEFAULT 15,
  completed           INTEGER NOT NULL DEFAULT 0,
  correct             INTEGER NOT NULL DEFAULT 0,
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_daily_target_overrides (
  student_id          TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  day_key             TEXT NOT NULL CHECK (day_key IN ('minggu','senin','selasa','rabu','kamis','jumat','sabtu')),
  completed_required  INTEGER NOT NULL,
  correct_required    INTEGER NOT NULL,
  PRIMARY KEY (student_id, day_key)
);

-- ─── Sesi ujian ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exam_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  code            TEXT NOT NULL UNIQUE,
  subjects        TEXT NOT NULL DEFAULT '[]',  -- JSON array subject keys
  session_date    TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count   INTEGER NOT NULL DEFAULT 0,
  elapsed_ms      INTEGER NOT NULL DEFAULT 0,
  skill_score     INTEGER NOT NULL DEFAULT 0,
  timer_enabled   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_code ON exam_sessions(code);

CREATE TABLE IF NOT EXISTS exam_session_results (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id        INTEGER NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id       TEXT NOT NULL REFERENCES questions(id),
  question_snapshot TEXT NOT NULL,             -- JSON: salinan soal saat ujian
  user_answer       TEXT,                      -- JSON-encoded (string | array)
  is_correct        INTEGER NOT NULL DEFAULT 0,
  metacog_reason    TEXT CHECK (metacog_reason IN ('tidak_tau','lupa_rumus','panik','terkecoh','salah_pencet') OR metacog_reason IS NULL),
  sort_order        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_exam_results_session ON exam_session_results(session_id);

CREATE TABLE IF NOT EXISTS exam_drafts (
  student_id      TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  subjects        TEXT NOT NULL DEFAULT '[]',
  questions       TEXT NOT NULL DEFAULT '[]',  -- JSON array full questions
  answers         TEXT NOT NULL DEFAULT '{}',
  ragu            TEXT NOT NULL DEFAULT '{}',
  timer_enabled   INTEGER NOT NULL DEFAULT 0,
  soal_per_materi INTEGER NOT NULL DEFAULT 5,
  start_time      INTEGER NOT NULL,
  elapsed_ms      INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Seed referensi statis ────────────────────────────────────────────────────

INSERT OR IGNORE INTO subjects (id, label, code, icon, color) VALUES
  ('MATBAS', 'Matematika & Penalaran Matematika', 'MAT', '📐', '#0ea5e9'),
  ('LINGPM', 'Penalaran Umum', 'PU', '🧠', '#8b5cf6'),
  ('BINDON', 'Literasi Bahasa Indonesia', 'LBI', '📖', '#f59e0b'),
  ('BINGEN', 'Literasi Bahasa Inggris', 'LBE', '🌐', '#10b981'),
  ('PPU',    'Pemahaman Bacaan & Menulis', 'PPU', '✍️', '#ec4899'),
  ('PBM',    'Pengetahuan Kuantitatif', 'PK', '🔢', '#6366f1');

INSERT OR IGNORE INTO subtests (id, label) VALUES
  ('PU',  'Penalaran Umum'),
  ('PPU', 'Pemahaman Bacaan & Menulis'),
  ('PK',  'Pengetahuan Kuantitatif'),
  ('LBI', 'Literasi Bahasa Indonesia'),
  ('LBE', 'Literasi Bahasa Inggris'),
  ('PM',  'Penalaran Matematika');

INSERT OR IGNORE INTO question_types (id, label, short_label, icon, description) VALUES
  ('pg',  'Pilihan Ganda', 'PG',  '🔘', 'Satu jawaban benar dari lima opsi (A–E).'),
  ('pmk', 'Pilihan Majemuk Kompleks', 'PMK', '☑️', 'Beberapa pernyataan; tentukan Benar/Salah tiap pernyataan.'),
  ('is',  'Isian Singkat', 'IS',  '✏️', 'Jawaban singkat tanpa opsi pilihan.');

INSERT OR IGNORE INTO students (id, name, mode, pending_mode, role) VALUES
  ('local-default', 'Pejuang UTBK', 'speedrun', 'speedrun', 'student');

INSERT OR IGNORE INTO student_daily_targets (student_id, completed_required, correct_required, completed, correct)
VALUES ('local-default', 25, 15, 17, 3);

INSERT OR IGNORE INTO student_mastery (student_id, subject_id, value)
SELECT 'local-default', id, 0.5 FROM subjects;
