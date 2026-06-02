import { initDb, closeDb } from './db.js';

await initDb();
console.log('✓ PostgreSQL migration selesai');
await closeDb();
