import { Router, Request, Response } from 'express';
import { searchSchema } from '../validation/schemas.js';
import { searchAll } from '../scrapers/registry.js';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const data = searchSchema.parse(req.query);
    const result = await searchAll(data.q, data.location);
    res.json(result);
  } catch (err: any) {
    if (err.issues) {
      res.status(400).json({ error: 'Validation failed', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
