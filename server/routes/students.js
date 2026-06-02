import { Router } from 'express';
import { query, DEFAULT_STUDENT_ID } from '../db.js';

const router = Router({ mergeParams: true });

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function getStudentId(req) {
  return req.params.studentId === 'default' ? DEFAULT_STUDENT_ID : req.params.studentId;
}

router.get('/', async (req, res) => {
  try {
    const id = getStudentId(req);
    const { rows: students } = await query('SELECT * FROM students WHERE id = $1', [id]);
    const student = students[0];
    if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

    const { rows: masteryRows } = await query(
      'SELECT subject_id, value FROM student_mastery WHERE student_id = $1', [id]
    );
    const { rows: targetRows } = await query(
      'SELECT * FROM student_daily_targets WHERE student_id = $1', [id]
    );
    const { rows: overrides } = await query(
      'SELECT * FROM student_daily_target_overrides WHERE student_id = $1', [id]
    );

    const target = targetRows[0];
    res.json({
      user: {
        name: student.name,
        mode: student.mode,
        pendingMode: student.pending_mode,
        role: student.role,
      },
      lastActiveDate: student.last_active_date,
      mastery: Object.fromEntries(masteryRows.map(r => [r.subject_id, r.value])),
      dailyTarget: target ? {
        completedRequired: target.completed_required,
        correctRequired: target.correct_required,
        completed: target.completed,
        correct: target.correct,
      } : null,
      dailyTargetOverrides: Object.fromEntries(
        overrides.map(o => [o.day_key, { completedRequired: o.completed_required, correctRequired: o.correct_required }])
      ),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const id = getStudentId(req);
    const { user, lastActiveDate, mastery, dailyTarget, dailyTargetOverrides } = req.body;

    await query(`
      INSERT INTO students (id, name, mode, pending_mode, role, last_active_date)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, mode=EXCLUDED.mode, pending_mode=EXCLUDED.pending_mode,
        role=EXCLUDED.role, last_active_date=EXCLUDED.last_active_date, updated_at=NOW()
    `, [id, user.name, user.mode, user.pendingMode, user.role, lastActiveDate ?? null]);

    if (mastery) {
      for (const [subj, val] of Object.entries(mastery)) {
        await query(`
          INSERT INTO student_mastery (student_id, subject_id, value) VALUES ($1,$2,$3)
          ON CONFLICT (student_id, subject_id) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
        `, [id, subj, val]);
      }
    }

    if (dailyTarget) {
      await query(`
        INSERT INTO student_daily_targets (student_id, completed_required, correct_required, completed, correct)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (student_id) DO UPDATE SET
          completed_required=EXCLUDED.completed_required, correct_required=EXCLUDED.correct_required,
          completed=EXCLUDED.completed, correct=EXCLUDED.correct, updated_at=NOW()
      `, [id, dailyTarget.completedRequired, dailyTarget.correctRequired, dailyTarget.completed, dailyTarget.correct]);
    }

    if (dailyTargetOverrides) {
      await query('DELETE FROM student_daily_target_overrides WHERE student_id = $1', [id]);
      for (const [day, o] of Object.entries(dailyTargetOverrides)) {
        await query(`
          INSERT INTO student_daily_target_overrides (student_id, day_key, completed_required, correct_required)
          VALUES ($1,$2,$3,$4)
        `, [id, day, o.completedRequired, o.correctRequired]);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function sessionWithResults(s) {
  const { rows: resultRows } = await query(`
    SELECT question_snapshot, user_answer, is_correct, metacog_reason, sort_order
    FROM exam_session_results WHERE session_id = $1 ORDER BY sort_order
  `, [s.id]);
  return {
    code: s.code,
    subjects: parseJson(s.subjects, []),
    date: s.session_date,
    totalQuestions: s.total_questions,
    correct: s.correct_count,
    elapsed: s.elapsed_ms,
    skillScore: s.skill_score,
    timerEnabled: !!s.timer_enabled,
    results: resultRows.map(r => ({
      ...parseJson(r.question_snapshot, {}),
      userAnswer: parseJson(r.user_answer, null),
      isCorrect: !!r.is_correct,
      reason: r.metacog_reason,
    })),
  };
}

router.get('/sessions', async (req, res) => {
  try {
    const id = getStudentId(req);
    const { rows } = await query(
      'SELECT * FROM exam_sessions WHERE student_id = $1 ORDER BY session_date DESC', [id]
    );
    const sessions = [];
    for (const s of rows) sessions.push(await sessionWithResults(s));
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const id = getStudentId(req);
    const session = req.body;

    const { rows } = await query(`
      INSERT INTO exam_sessions (student_id, code, subjects, session_date, total_questions, correct_count, elapsed_ms, skill_score, timer_enabled)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [
      id, session.code, session.subjects, session.date,
      session.totalQuestions, session.correct, session.elapsed, session.skillScore,
      session.timerEnabled ?? false,
    ]);

    const sessionId = rows[0].id;
    for (let i = 0; i < (session.results ?? []).length; i++) {
      const r = session.results[i];
      await query(`
        INSERT INTO exam_session_results (session_id, question_id, question_snapshot, user_answer, is_correct, metacog_reason, sort_order)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [
        sessionId, r.id, r, r.userAnswer ?? null, r.isCorrect ?? false, r.reason ?? null, i,
      ]);
    }

    res.status(201).json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/sessions/:code', async (req, res) => {
  try {
    const id = getStudentId(req);
    const { rows } = await query(
      'SELECT * FROM exam_sessions WHERE student_id = $1 AND code = $2', [id, req.params.code]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    res.json(await sessionWithResults(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/draft', async (req, res) => {
  try {
    const id = getStudentId(req);
    const { rows } = await query('SELECT * FROM exam_drafts WHERE student_id = $1', [id]);
    const d = rows[0];
    if (!d) return res.json(null);
    res.json({
      code: d.code,
      subjects: parseJson(d.subjects, []),
      questions: parseJson(d.questions, []),
      answers: parseJson(d.answers, {}),
      ragu: parseJson(d.ragu, {}),
      timerEnabled: !!d.timer_enabled,
      soalPerMateri: d.soal_per_materi,
      startTime: Number(d.start_time),
      elapsed: d.elapsed_ms,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/draft', async (req, res) => {
  try {
    const id = getStudentId(req);
    const d = req.body;
    await query(`
      INSERT INTO exam_drafts (student_id, code, subjects, questions, answers, ragu, timer_enabled, soal_per_materi, start_time, elapsed_ms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (student_id) DO UPDATE SET
        code=EXCLUDED.code, subjects=EXCLUDED.subjects, questions=EXCLUDED.questions,
        answers=EXCLUDED.answers, ragu=EXCLUDED.ragu, timer_enabled=EXCLUDED.timer_enabled,
        soal_per_materi=EXCLUDED.soal_per_materi, start_time=EXCLUDED.start_time,
        elapsed_ms=EXCLUDED.elapsed_ms, updated_at=NOW()
    `, [
      id, d.code, d.subjects, d.questions, d.answers, d.ragu,
      d.timerEnabled ?? false, d.soalPerMateri, d.startTime, d.elapsed ?? 0,
    ]);
    res.json(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/draft', async (req, res) => {
  try {
    await query('DELETE FROM exam_drafts WHERE student_id = $1', [getStudentId(req)]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
