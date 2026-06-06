import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/connection.js';
import { registerSchema, loginSchema } from '../validation/schemas.js';
import { generateToken, authRequired, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(data.email, passwordHash);
    const token = generateToken(result.lastInsertRowid as number);

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, email: data.email },
    });
  } catch (err: any) {
    if (err.issues) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const db = getDb();

    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(data.email) as any;
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    if (err.issues) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authRequired, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;
