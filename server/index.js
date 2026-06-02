import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, query } from './db.js';
import { seedFromJson } from './seed.js';
import questionsRouter from './routes/questions.js';
import appDataRouter from './routes/appData.js';
import studentsRouter from './routes/students.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

async function start() {
  try {
    await initDb();
    console.log('✓ PostgreSQL schema siap');

    const { rows } = await query('SELECT COUNT(*)::int AS c FROM questions');
    if (rows[0].c === 0) {
      console.log('Database kosong — menjalankan seed...');
      await seedFromJson();
    }
  } catch (err) {
    console.error('✗ Gagal konek PostgreSQL:', err.message);
    console.error('  Pastikan PostgreSQL jalan: npm run db:up');
    process.exit(1);
  }

  app.get('/api/health', async (_req, res) => {
    try {
      const [q, u, s] = await Promise.all([
        query('SELECT COUNT(*)::int AS c FROM questions'),
        query('SELECT COUNT(*)::int AS c FROM users'),
        query('SELECT COUNT(*)::int AS c FROM exam_sessions'),
      ]);
      res.json({
        ok: true,
        engine: 'postgresql',
        questions: q.rows[0].c,
        users: u.rows[0].c,
        sessions: s.rows[0].c,
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.use('/api/questions', questionsRouter);
  app.use('/api', appDataRouter);
  app.use('/api/students/:studentId', studentsRouter);

  app.listen(PORT, () => {
    console.log(`🗄️  OTODU API server → http://localhost:${PORT}`);
    console.log(`   Database       → PostgreSQL`);
  });
}

start();
