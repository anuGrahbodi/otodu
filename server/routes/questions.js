import { Router } from 'express';
import { query, rowToQuestion, questionToRow } from '../db.js';

const router = Router();

function distributeSoalCounts(total, subjectCount) {
  if (subjectCount <= 0) return [];
  const base = Math.floor(total / subjectCount);
  const remainder = total % subjectCount;
  return Array.from({ length: subjectCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive !== 'false';
    const sql = includeInactive
      ? 'SELECT * FROM questions ORDER BY id'
      : 'SELECT * FROM questions WHERE is_active = true ORDER BY id';
    const { rows } = await query(sql);
    res.json(rows.map(rowToQuestion));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/random', async (req, res) => {
  try {
    const subjects = (req.query.subjects || '').split(',').filter(Boolean);
    const total = parseInt(req.query.total || '10', 10);
    if (!subjects.length || total <= 0) return res.json([]);

    const counts = distributeSoalCounts(total, subjects.length);
    const result = [];

    for (let i = 0; i < subjects.length; i++) {
      const { rows } = await query(`
        SELECT * FROM questions
        WHERE subject_id = $1 AND is_active = true
        ORDER BY RANDOM() LIMIT $2
      `, [subjects[i], counts[i]]);
      result.push(...rows.map(rowToQuestion));
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Soal tidak ditemukan' });
    res.json(rowToQuestion(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const row = questionToRow(req.body);
    await query(`
      INSERT INTO questions (
        id, subject_id, subtest_id, question_type_id, difficulty,
        dina_slip, dina_guess, stimulus, question_text, explanation,
        answer, answer_variants, options, statements, distractor_analysis,
        community_stats, tags, source, year_ref, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    `, [
      row.id, row.subject_id, row.subtest_id, row.question_type_id, row.difficulty,
      row.dina_slip, row.dina_guess, row.stimulus, row.question_text, row.explanation,
      row.answer, row.answer_variants, row.options, row.statements, row.distractor_analysis,
      row.community_stats, row.tags, row.source, row.year_ref, row.is_active,
    ]);
    const { rows } = await query('SELECT * FROM questions WHERE id = $1', [row.id]);
    res.status(201).json(rowToQuestion(rows[0]));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const row = questionToRow({ ...req.body, id: req.params.id });
    const result = await query(`
      UPDATE questions SET
        subject_id=$2, subtest_id=$3, question_type_id=$4, difficulty=$5,
        dina_slip=$6, dina_guess=$7, stimulus=$8, question_text=$9, explanation=$10,
        answer=$11, answer_variants=$12, options=$13, statements=$14,
        distractor_analysis=$15, community_stats=$16, tags=$17, source=$18,
        year_ref=$19, is_active=$20, updated_at=NOW()
      WHERE id=$1
    `, [
      row.id, row.subject_id, row.subtest_id, row.question_type_id, row.difficulty,
      row.dina_slip, row.dina_guess, row.stimulus, row.question_text, row.explanation,
      row.answer, row.answer_variants, row.options, row.statements, row.distractor_analysis,
      row.community_stats, row.tags, row.source, row.year_ref, row.is_active,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Soal tidak ditemukan' });
    const { rows } = await query('SELECT * FROM questions WHERE id = $1', [row.id]);
    res.json(rowToQuestion(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM questions WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Soal tidak ditemukan' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
