import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, query, questionToRow } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUBJECT_TO_SUBTEST = {
  LINGPM: 'PU', PPU: 'PPU', PBM: 'PK', MATBAS: 'PM', BINDON: 'LBI', BINGEN: 'LBE',
};

export async function seedFromJson() {
  await initDb();

  const questionsPath = path.join(__dirname, '..', 'src', 'db', 'questions.json');
  const appDataPath = path.join(__dirname, '..', 'src', 'db', 'appData.json');

  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  const appData = JSON.parse(fs.readFileSync(appDataPath, 'utf-8'));

  for (const q of questions) {
    const normalized = {
      ...q,
      questionType: q.questionType ?? 'pg',
      subtest: q.subtest ?? SUBJECT_TO_SUBTEST[q.subject] ?? 'PU',
      isActive: q.isActive !== false,
    };
    const row = questionToRow(normalized);
    await query(`
      INSERT INTO questions (
        id, subject_id, subtest_id, question_type_id, difficulty,
        dina_slip, dina_guess, stimulus, question_text, explanation,
        answer, answer_variants, options, statements, distractor_analysis,
        community_stats, tags, source, year_ref, is_active, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        subject_id=$2, subtest_id=$3, question_type_id=$4, difficulty=$5,
        dina_slip=$6, dina_guess=$7, stimulus=$8, question_text=$9, explanation=$10,
        answer=$11, answer_variants=$12, options=$13, statements=$14,
        distractor_analysis=$15, community_stats=$16, tags=$17, source=$18,
        year_ref=$19, is_active=$20, updated_at=NOW()
    `, [
      row.id, row.subject_id, row.subtest_id, row.question_type_id, row.difficulty,
      row.dina_slip, row.dina_guess, row.stimulus, row.question_text, row.explanation,
      row.answer, row.answer_variants, row.options, row.statements, row.distractor_analysis,
      row.community_stats, row.tags, row.source, row.year_ref, row.is_active,
    ]);
  }

  const s = appData.siteSettings;
  await query(`
    INSERT INTO site_settings (
      id, app_name, tagline, utbk_date, admin_password, scoring_method,
      proctor_enabled, registration_open, daily_target_default, soal_per_materi_default, updated_at
    ) VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (id) DO UPDATE SET
      app_name=$1, tagline=$2, utbk_date=$3, admin_password=$4, scoring_method=$5,
      proctor_enabled=$6, registration_open=$7, daily_target_default=$8,
      soal_per_materi_default=$9, updated_at=NOW()
  `, [
    s.appName, s.tagline, s.utbkDate, s.adminPassword, s.scoringMethod,
    s.proctorEnabled, s.registrationOpen, s.dailyTargetDefault, s.soalPerMateriDefault,
  ]);

  const c = appData.communityStats;
  await query(`
    INSERT INTO community_stats (
      id, total_users, total_questions, total_sessions_all_time, sessions_today,
      users_completed_target_today, soal_dikerjakan_jam_ini, avg_score_community,
      top_subject_struggle, top_subject_struggle_correct_rate,
      users_improved_pu_this_week, top_performer_threshold, updated_at
    ) VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
    ON CONFLICT (id) DO UPDATE SET
      total_users=$1, total_questions=$2, total_sessions_all_time=$3, sessions_today=$4,
      users_completed_target_today=$5, soal_dikerjakan_jam_ini=$6, avg_score_community=$7,
      top_subject_struggle=$8, top_subject_struggle_correct_rate=$9,
      users_improved_pu_this_week=$10, top_performer_threshold=$11, updated_at=NOW()
  `, [
    c.totalUsers, questions.length, c.totalSessionsAllTime, c.sessionsToday,
    c.usersCompletedTargetToday, c.soalDikerjakanJamIni, c.avgScoreCommunity,
    c.topSubjectStruggle, c.topSubjectStruggleCorrectRate,
    c.usersImprovedPUThisWeek, c.topPerformerThreshold,
  ]);

  await query('DELETE FROM ticker_messages');
  for (let i = 0; i < appData.tickerMessages.length; i++) {
    await query('INSERT INTO ticker_messages (sort_order, message) VALUES ($1, $2)', [i, appData.tickerMessages[i]]);
  }

  for (const pkg of appData.tryoutPackages) {
    await query(`
      INSERT INTO tryout_packages (id, name, start_date, end_date, status, participants, soal_per_materi, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      ON CONFLICT (id) DO UPDATE SET
        name=$2, start_date=$3, end_date=$4, status=$5, participants=$6, soal_per_materi=$7, updated_at=NOW()
    `, [pkg.id, pkg.name, pkg.startDate, pkg.endDate, pkg.status, pkg.participants ?? 0, pkg.soalPerMateri ?? 10]);
    await query('DELETE FROM tryout_package_subjects WHERE package_id = $1', [pkg.id]);
    for (const subj of pkg.subjects) {
      await query(
        'INSERT INTO tryout_package_subjects (package_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [pkg.id, subj]
      );
    }
  }

  for (const u of appData.users) {
    await query(`
      INSERT INTO users (id, name, email, role, subscription, last_login, join_date, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      ON CONFLICT (id) DO UPDATE SET
        name=$2, email=$3, role=$4, subscription=$5, last_login=$6, join_date=$7, updated_at=NOW()
    `, [u.id, u.name, u.email, u.role, u.subscription, u.lastLogin, u.joinDate]);
  }

  for (const entry of appData.activityLog) {
    await query(`
      INSERT INTO activity_log (id, type, message, timestamp) VALUES ($1,$2,$3,$4)
      ON CONFLICT (id) DO NOTHING
    `, [entry.id, entry.type, entry.message, entry.timestamp]);
  }

  console.log(`✓ Seed PostgreSQL selesai: ${questions.length} soal, ${appData.users.length} user, ${appData.tryoutPackages.length} paket tryout`);
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedFromJson()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}
