import { Router, Request, Response } from 'express';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import { getDb } from '../db/connection.js';
import { authOptional, AuthRequest } from '../middleware/auth.js';

const router = Router();

function getJobs(req: AuthRequest, db: ReturnType<typeof getDb>): any[] {
  if (req.userId) {
    return db.prepare('SELECT * FROM saved_jobs WHERE user_id = ? ORDER BY saved_at DESC').all(req.userId) as any[];
  }
  return [];
}

router.get('/csv', authOptional, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const jobs = getJobs(req, db);

  const records = jobs.map((j: any) => ({
    Title: j.title,
    Company: j.company,
    Location: j.location,
    Board: j.board,
    URL: j.url,
    Description: j.description,
  }));

  const csv = stringify(records, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="jobs_export_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

router.get('/excel', authOptional, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const jobs = getJobs(req, db);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Jobs');

  sheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Location', key: 'location', width: 25 },
    { header: 'Board', key: 'board', width: 15 },
    { header: 'URL', key: 'url', width: 50 },
    { header: 'Description', key: 'description', width: 60 },
  ];

  jobs.forEach((j: any) => {
    sheet.addRow({ title: j.title, company: j.company, location: j.location, board: j.board, url: j.url, description: j.description });
  });

  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="jobs_export_${new Date().toISOString().split('T')[0]}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

export default router;
