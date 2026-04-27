import type { ReportData } from '../context/ReportContext';

const API = 'http://localhost:3001/api';
const STORAGE_KEY = 'medivoice_reports_v1';
const MIGRATION_FLAG = 'medivoice_db_migrated';

const toRow = (report: ReportData) => ({
  report_id: report.id,
  status: report.status,
  created_at: report.createdAt,
  is_hidden: report.isHidden ?? false,
  patient: report.patient,
  transcripts: report.transcripts,
  ai_analysis: report.aiAnalysis,
  blood_report: report.bloodReport,
});

const toData = (row: Record<string, unknown>): ReportData => ({
  id: row.report_id as string,
  status: row.status as ReportData['status'],
  createdAt: row.created_at as number,
  isHidden: row.is_hidden as boolean,
  patient: row.patient as ReportData['patient'],
  transcripts: (row.transcripts as ReportData['transcripts']) ?? [],
  aiAnalysis: row.ai_analysis as ReportData['aiAnalysis'],
  bloodReport: row.blood_report as ReportData['bloodReport'],
});

export async function saveReport(report: ReportData): Promise<void> {
  const res = await fetch(`${API}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toRow(report)),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function getAllReports(): Promise<ReportData[]> {
  const res = await fetch(`${API}/reports`);
  if (!res.ok) throw new Error((await res.json()).error);
  const rows = await res.json();
  return rows.map(toData);
}

export async function getReportById(id: string): Promise<ReportData | undefined> {
  const res = await fetch(`${API}/reports/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error((await res.json()).error);
  return toData(await res.json());
}

export async function updateReport(id: string, updates: Partial<ReportData>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.isHidden !== undefined) patch.is_hidden = updates.isHidden;
  if (updates.aiAnalysis !== undefined) patch.ai_analysis = updates.aiAnalysis;
  if (updates.bloodReport !== undefined) patch.blood_report = updates.bloodReport;
  if (updates.transcripts !== undefined) patch.transcripts = updates.transcripts;
  if (updates.patient !== undefined) patch.patient = updates.patient;

  const res = await fetch(`${API}/reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(`${API}/reports/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function importFromLocalStorage(): Promise<{ imported: number; skipped: number }> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { imported: 0, skipped: 0 };

  let reports: ReportData[] = [];
  try { reports = JSON.parse(raw); } catch { return { imported: 0, skipped: 0 }; }

  let imported = 0;
  let skipped = 0;
  for (const report of reports) {
    try {
      await saveReport(report);
      imported++;
    } catch {
      skipped++;
    }
  }
  localStorage.setItem(MIGRATION_FLAG, 'v1');
  return { imported, skipped };
}

export function isMigrated(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === 'v1';
}
