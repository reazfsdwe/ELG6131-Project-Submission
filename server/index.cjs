const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
  database: 'medivoice',
});

app.get('/api/reports', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM reports ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM reports WHERE report_id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/reports', async (req, res) => {
  const r = req.body;
  console.log('POST /api/reports received:', r.report_id);
  console.log('Fields:', Object.keys(r));
  console.log('patient type:', typeof r.patient, 'transcripts type:', typeof r.transcripts);
  console.log('ai_analysis type:', typeof r.ai_analysis, 'blood_report type:', typeof r.blood_report);
  try {
    await pool.query(
      `INSERT INTO reports (report_id, status, created_at, is_hidden, patient, transcripts, ai_analysis, blood_report)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)
       ON CONFLICT (report_id) DO UPDATE SET
         status = EXCLUDED.status,
         is_hidden = EXCLUDED.is_hidden,
         patient = EXCLUDED.patient,
         transcripts = EXCLUDED.transcripts,
         ai_analysis = EXCLUDED.ai_analysis,
         blood_report = EXCLUDED.blood_report`,
      [r.report_id, r.status, r.created_at, r.is_hidden ?? false,
       JSON.stringify(r.patient || {}),
       JSON.stringify(r.transcripts || []),
       r.ai_analysis != null ? JSON.stringify(r.ai_analysis) : null,
       r.blood_report != null ? JSON.stringify(r.blood_report) : null]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/reports error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/reports/:id', async (req, res) => {
  const updates = req.body;
  const jsonCols = ['patient', 'transcripts', 'ai_analysis', 'blood_report'];
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, val] of Object.entries(updates)) {
    if (jsonCols.includes(key)) {
      fields.push(`${key} = $${i}::jsonb`);
      values.push(val != null ? JSON.stringify(val) : null);
    } else {
      fields.push(`${key} = $${i}`);
      values.push(val);
    }
    i++;
  }

  if (fields.length === 0) return res.json({ ok: true });

  values.push(req.params.id);
  try {
    await pool.query(
      `UPDATE reports SET ${fields.join(', ')} WHERE report_id = $${i}`,
      values
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE report_id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
