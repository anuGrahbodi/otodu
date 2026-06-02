import { Router } from 'express';
import { query } from '../db.js';
import { seedFromJson } from '../seed.js';

const router = Router();

function rowToSettings(row) {
  return {
    appName: row.app_name,
    tagline: row.tagline,
    utbkDate: row.utbk_date,
    adminPassword: row.admin_password,
    scoringMethod: row.scoring_method,
    proctorEnabled: !!row.proctor_enabled,
    registrationOpen: !!row.registration_open,
    dailyTargetDefault: row.daily_target_default,
    soalPerMateriDefault: row.soal_per_materi_default,
  };
}

function rowToStats(row) {
  return {
    totalUsers: row.total_users,
    totalQuestions: row.total_questions,
    totalSessionsAllTime: row.total_sessions_all_time,
    sessionsToday: row.sessions_today,
    usersCompletedTargetToday: row.users_completed_target_today,
    soalDikerjakanJamIni: row.soal_dikerjakan_jam_ini,
    avgScoreCommunity: row.avg_score_community,
    topSubjectStruggle: row.top_subject_struggle,
    topSubjectStruggleCorrectRate: row.top_subject_struggle_correct_rate,
    usersImprovedPUThisWeek: row.users_improved_pu_this_week,
    topPerformerThreshold: row.top_performer_threshold,
  };
}

router.get('/settings', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM site_settings WHERE id = 1');
    if (!rows[0]) return res.status(404).json({ error: 'Settings belum di-seed' });
    res.json(rowToSettings(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const s = req.body;
    await query(`
      UPDATE site_settings SET
        app_name=COALESCE($1, app_name), tagline=COALESCE($2, tagline),
        utbk_date=COALESCE($3, utbk_date), admin_password=COALESCE($4, admin_password),
        scoring_method=COALESCE($5, scoring_method),
        proctor_enabled=COALESCE($6, proctor_enabled),
        registration_open=COALESCE($7, registration_open),
        daily_target_default=COALESCE($8, daily_target_default),
        soal_per_materi_default=COALESCE($9, soal_per_materi_default),
        updated_at=NOW()
      WHERE id = 1
    `, [
      s.appName ?? null, s.tagline ?? null, s.utbkDate ?? null, s.adminPassword ?? null,
      s.scoringMethod ?? null, s.proctorEnabled ?? null, s.registrationOpen ?? null,
      s.dailyTargetDefault ?? null, s.soalPerMateriDefault ?? null,
    ]);
    const { rows } = await query('SELECT * FROM site_settings WHERE id = 1');
    res.json(rowToSettings(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/community-stats', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM community_stats WHERE id = 1');
    res.json(rowToStats(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/community-stats', async (req, res) => {
  try {
    const c = req.body;
    await query(`
      UPDATE community_stats SET
        total_users=COALESCE($1, total_users),
        total_questions=COALESCE($2, total_questions),
        total_sessions_all_time=COALESCE($3, total_sessions_all_time),
        sessions_today=COALESCE($4, sessions_today),
        users_completed_target_today=COALESCE($5, users_completed_target_today),
        soal_dikerjakan_jam_ini=COALESCE($6, soal_dikerjakan_jam_ini),
        avg_score_community=COALESCE($7, avg_score_community),
        top_subject_struggle=COALESCE($8, top_subject_struggle),
        top_subject_struggle_correct_rate=COALESCE($9, top_subject_struggle_correct_rate),
        users_improved_pu_this_week=COALESCE($10, users_improved_pu_this_week),
        top_performer_threshold=COALESCE($11, top_performer_threshold),
        updated_at=NOW()
      WHERE id = 1
    `, [
      c.totalUsers ?? null, c.totalQuestions ?? null, c.totalSessionsAllTime ?? null,
      c.sessionsToday ?? null, c.usersCompletedTargetToday ?? null,
      c.soalDikerjakanJamIni ?? null, c.avgScoreCommunity ?? null,
      c.topSubjectStruggle ?? null, c.topSubjectStruggleCorrectRate ?? null,
      c.usersImprovedPUThisWeek ?? null, c.topPerformerThreshold ?? null,
    ]);
    const { rows } = await query('SELECT * FROM community_stats WHERE id = 1');
    res.json(rowToStats(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/ticker-messages', async (_req, res) => {
  try {
    const { rows } = await query('SELECT message FROM ticker_messages ORDER BY sort_order');
    res.json(rows.map(r => r.message));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/ticker-messages', async (req, res) => {
  try {
    const messages = req.body.messages ?? req.body;
    await query('DELETE FROM ticker_messages');
    for (let i = 0; i < messages.length; i++) {
      await query('INSERT INTO ticker_messages (sort_order, message) VALUES ($1, $2)', [i, messages[i]]);
    }
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tryout-packages', async (_req, res) => {
  try {
    const { rows: pkgs } = await query('SELECT * FROM tryout_packages ORDER BY start_date DESC');
    const result = [];
    for (const p of pkgs) {
      const { rows: subs } = await query(
        'SELECT subject_id FROM tryout_package_subjects WHERE package_id = $1', [p.id]
      );
      result.push({
        id: p.id,
        name: p.name,
        startDate: p.start_date,
        endDate: p.end_date,
        status: p.status,
        participants: p.participants,
        soalPerMateri: p.soal_per_materi,
        subjects: subs.map(r => r.subject_id),
      });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/tryout-packages', async (req, res) => {
  try {
    const p = req.body;
    await query(`
      INSERT INTO tryout_packages (id, name, start_date, end_date, status, participants, soal_per_materi)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [p.id, p.name, p.startDate, p.endDate, p.status, p.participants ?? 0, p.soalPerMateri ?? 10]);
    for (const s of p.subjects ?? []) {
      await query('INSERT INTO tryout_package_subjects (package_id, subject_id) VALUES ($1, $2)', [p.id, s]);
    }
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/tryout-packages/:id', async (req, res) => {
  try {
    const p = { ...req.body, id: req.params.id };
    await query(`
      UPDATE tryout_packages SET name=$2, start_date=$3, end_date=$4, status=$5,
        participants=$6, soal_per_materi=$7, updated_at=NOW()
      WHERE id=$1
    `, [p.id, p.name, p.startDate, p.endDate, p.status, p.participants ?? 0, p.soalPerMateri ?? 10]);
    await query('DELETE FROM tryout_package_subjects WHERE package_id = $1', [p.id]);
    for (const s of p.subjects ?? []) {
      await query('INSERT INTO tryout_package_subjects (package_id, subject_id) VALUES ($1, $2)', [p.id, s]);
    }
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/tryout-packages/:id', async (req, res) => {
  try {
    await query('DELETE FROM tryout_packages WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM users ORDER BY join_date DESC');
    res.json(rows.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      subscription: u.subscription, lastLogin: u.last_login, joinDate: u.join_date,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const u = req.body;
    await query(`
      UPDATE users SET name=$2, email=$3, role=$4, subscription=$5, last_login=$6, join_date=$7, updated_at=NOW()
      WHERE id=$1
    `, [u.id, u.name, u.email, u.role, u.subscription, u.lastLogin, u.joinDate]);
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/activity-log', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 50');
    res.json(rows.map(e => ({ id: e.id, type: e.type, message: e.message, timestamp: e.timestamp })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/activity-log', async (req, res) => {
  try {
    const e = req.body;
    await query(
      'INSERT INTO activity_log (id, type, message, timestamp) VALUES ($1,$2,$3,$4)',
      [e.id, e.type, e.message, e.timestamp ?? new Date().toISOString()]
    );
    await query(`
      DELETE FROM activity_log WHERE id NOT IN (
        SELECT id FROM (SELECT id FROM activity_log ORDER BY timestamp DESC LIMIT 50) t
      )
    `);
    res.status(201).json(e);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/reset', async (_req, res) => {
  try {
    await query('DELETE FROM exam_session_results');
    await query('DELETE FROM exam_sessions');
    await query('DELETE FROM exam_drafts');
    await query('DELETE FROM student_daily_target_overrides');
    await query("DELETE FROM student_mastery WHERE student_id != 'local-default'");
    await query("DELETE FROM student_daily_targets WHERE student_id != 'local-default'");
    await query('DELETE FROM activity_log');
    await query('DELETE FROM tryout_package_subjects');
    await query('DELETE FROM tryout_packages');
    await query('DELETE FROM users');
    await query('DELETE FROM ticker_messages');
    await query('DELETE FROM questions');
    await query('DELETE FROM community_stats');
    await query('DELETE FROM site_settings');
    await seedFromJson();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
