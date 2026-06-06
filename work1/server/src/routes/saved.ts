import { Router, Response } from 'express';
import { getDb } from '../db/connection.js';
import { authRequired, AuthRequest } from '../middleware/auth.js';
import { saveJobSchema } from '../validation/schemas.js';

const router = Router();

router.get('/', authRequired, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const jobs = db.prepare('SELECT * FROM saved_jobs WHERE user_id = ? ORDER BY saved_at DESC').all(req.userId);
  res.json({ jobs });
});

router.post('/', authRequired, (req: AuthRequest, res: Response) => {
  try {
    const data = saveJobSchema.parse(req.body);
    const db = getDb();

    const existing = db.prepare('SELECT id FROM saved_jobs WHERE user_id = ? AND board = ? AND job_id = ?')
      .get(req.userId, data.board, data.jobId);

    if (existing) {
      res.status(409).json({ error: 'Job already saved' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO saved_jobs (user_id, board, job_id, title, company, location, url, description, posted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.userId, data.board, data.jobId, data.title, data.company, data.location, data.url, data.description, data.postedAt);

    const job = db.prepare('SELECT * FROM saved_jobs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ job });
  } catch (err: any) {
    if (err.issues) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authRequired, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM saved_jobs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Saved job not found' });
    return;
  }
  res.json({ message: 'Job removed from saved' });
});

export default router;
