-- OTODU UTBK Platform — PostgreSQL Schema
-- Jalankan via: npm run db:migrate  (atau otomatis saat server start)

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
  ideal_time          INTEGER NOT NULL DEFAULT 90,
  dina_slip           DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  dina_guess          DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  stimulus            TEXT,
  question_text       TEXT NOT NULL,
  explanation         TEXT NOT NULL DEFAULT '',
  answer              TEXT NOT NULL,
  answer_variants     JSONB NOT NULL DEFAULT '[]',
  options             JSONB NOT NULL DEFAULT '[]',
  statements          JSONB NOT NULL DEFAULT '[]',
  distractor_analysis JSONB NOT NULL DEFAULT '{}',
  community_stats     JSONB NOT NULL DEFAULT '{"correctRate":0.5,"ontimeRate":0.5}',
  tags                JSONB NOT NULL DEFAULT '[]',
  source              TEXT NOT NULL DEFAULT '',
  year_ref            INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_subtest ON questions(subtest_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type_id);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

-- ─── Pengaturan global (singleton) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_settings (
  id                      INTEGER PRIMARY KEY CHECK (id = 1),
  app_name                TEXT NOT NULL DEFAULT 'OTODUv3',
  tagline                 TEXT NOT NULL DEFAULT '',
  utbk_date               TIMESTAMPTZ NOT NULL,
  admin_password          TEXT NOT NULL DEFAULT 'admin123',
  scoring_method          TEXT NOT NULL DEFAULT 'irt' CHECK (scoring_method IN ('irt', 'klasik')),
  proctor_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  registration_open       BOOLEAN NOT NULL DEFAULT TRUE,
  daily_target_default    INTEGER NOT NULL DEFAULT 25,
  soal_per_materi_default INTEGER NOT NULL DEFAULT 5,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_stats (
  id                              INTEGER PRIMARY KEY CHECK (id = 1),
  total_users                     INTEGER NOT NULL DEFAULT 0,
  total_questions                 INTEGER NOT NULL DEFAULT 0,
  total_sessions_all_time         INTEGER NOT NULL DEFAULT 0,
  sessions_today                  INTEGER NOT NULL DEFAULT 0,
  users_completed_target_today    INTEGER NOT NULL DEFAULT 0,
  soal_dikerjakan_jam_ini         INTEGER NOT NULL DEFAULT 0,
  avg_score_community             DOUBLE PRECISION NOT NULL DEFAULT 0,
  top_subject_struggle            TEXT NOT NULL DEFAULT '',
  top_subject_struggle_correct_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  users_improved_pu_this_week     INTEGER NOT NULL DEFAULT 0,
  top_performer_threshold         INTEGER NOT NULL DEFAULT 0,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticker_messages (
  id          SERIAL PRIMARY KEY,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  message     TEXT NOT NULL
);

-- ─── Tryout & admin ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tryout_packages (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'aktif', 'selesai')),
  participants    INTEGER NOT NULL DEFAULT 0,
  soal_per_materi INTEGER NOT NULL DEFAULT 10,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  join_date     DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('system', 'content', 'user')),
  message     TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_ts ON activity_log(timestamp DESC);

-- ─── Profil siswa ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS students (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT 'Pejuang UTBK',
  mode             TEXT NOT NULL DEFAULT 'speedrun' CHECK (mode IN ('speedrun', 'santai')),
  pending_mode     TEXT NOT NULL DEFAULT 'speedrun' CHECK (pending_mode IN ('speedrun', 'santai')),
  role             TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  last_active_date DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_mastery (
  student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id   TEXT NOT NULL REFERENCES subjects(id),
  value        DOUBLE PRECISION NOT NULL DEFAULT 0.5 CHECK (value >= 0 AND value <= 1),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS student_daily_targets (
  student_id          TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  completed_required  INTEGER NOT NULL DEFAULT 25,
  correct_required    INTEGER NOT NULL DEFAULT 15,
  completed           INTEGER NOT NULL DEFAULT 0,
  correct             INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  id              SERIAL PRIMARY KEY,
  student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  code            TEXT NOT NULL UNIQUE,
  subjects        JSONB NOT NULL DEFAULT '[]',
  session_date    TIMESTAMPTZ NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count   INTEGER NOT NULL DEFAULT 0,
  elapsed_ms      INTEGER NOT NULL DEFAULT 0,
  skill_score     INTEGER NOT NULL DEFAULT 0,
  timer_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_student ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_code ON exam_sessions(code);

CREATE TABLE IF NOT EXISTS exam_session_results (
  id                SERIAL PRIMARY KEY,
  session_id        INTEGER NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id       TEXT NOT NULL REFERENCES questions(id),
  question_snapshot JSONB NOT NULL,
  user_answer       JSONB,
  is_correct        BOOLEAN NOT NULL DEFAULT FALSE,
  metacog_reason    TEXT CHECK (metacog_reason IN ('tidak_tau','lupa_rumus','panik','terkecoh','salah_pencet') OR metacog_reason IS NULL),
  sort_order        INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_exam_results_session ON exam_session_results(session_id);

CREATE TABLE IF NOT EXISTS exam_drafts (
  student_id      TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  subjects        JSONB NOT NULL DEFAULT '[]',
  questions       JSONB NOT NULL DEFAULT '[]',
  answers         JSONB NOT NULL DEFAULT '{}',
  ragu            JSONB NOT NULL DEFAULT '{}',
  timer_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  soal_per_materi INTEGER NOT NULL DEFAULT 5,
  start_time      BIGINT NOT NULL,
  elapsed_ms      INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed referensi statis ────────────────────────────────────────────────────

INSERT INTO subjects (id, label, code, icon, color) VALUES
  ('MATBAS', 'Matematika & Penalaran Matematika', 'MAT', '📐', '#0ea5e9'),
  ('LINGPM', 'Penalaran Umum', 'PU', '🧠', '#8b5cf6'),
  ('BINDON', 'Literasi Bahasa Indonesia', 'LBI', '📖', '#f59e0b'),
  ('BINGEN', 'Literasi Bahasa Inggris', 'LBE', '🌐', '#10b981'),
  ('PPU',    'Pemahaman Bacaan & Menulis', 'PPU', '✍️', '#ec4899'),
  ('PBM',    'Pengetahuan Kuantitatif', 'PK', '🔢', '#6366f1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO subtests (id, label) VALUES
  ('PU',  'Penalaran Umum'),
  ('PPU', 'Pemahaman Bacaan & Menulis'),
  ('PK',  'Pengetahuan Kuantitatif'),
  ('LBI', 'Literasi Bahasa Indonesia'),
  ('LBE', 'Literasi Bahasa Inggris'),
  ('PM',  'Penalaran Matematika')
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_types (id, label, short_label, icon, description) VALUES
  ('pg',  'Pilihan Ganda', 'PG',  '🔘', 'Satu jawaban benar dari lima opsi (A–E).'),
  ('pmk', 'Pilihan Majemuk Kompleks', 'PMK', '☑️', 'Beberapa pernyataan; tentukan Benar/Salah tiap pernyataan.'),
  ('is',  'Isian Singkat', 'IS',  '✏️', 'Jawaban singkat tanpa opsi pilihan.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (id, name, mode, pending_mode, role) VALUES
  ('local-default', 'Pejuang UTBK', 'speedrun', 'speedrun', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_daily_targets (student_id, completed_required, correct_required, completed, correct)
VALUES ('local-default', 25, 15, 17, 3)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO student_mastery (student_id, subject_id, value)
SELECT 'local-default', id, 0.5 FROM subjects
ON CONFLICT (student_id, subject_id) DO NOTHING;
