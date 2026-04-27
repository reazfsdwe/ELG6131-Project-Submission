import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  getAllReports,
  saveReport,
  updateReport as dbUpdateReport,
  deleteReport as dbDeleteReport,
  importFromLocalStorage,
  isMigrated,
} from '../services/dbService';

export interface TranscriptSegment {
  id: number;
  timestamp: string;
  text: string;
  speaker: 'doctor' | 'system' | 'ai';
}

export interface BloodIndicator {
  name: string;
  value: string;
  unit: string;
  range: string;
  status: 'normal' | 'high' | 'low';
  description?: string;
}

export interface ReportData {
  id: string;
  patient: {
    name: string;
    id: string;
    phone: string;
    age?: string;
    gender?: string;
    bloodType?: string;
    examDate: string;
    examType: string;
  };
  transcripts: TranscriptSegment[];
  aiAnalysis: {
    summary: string;
    keyPoints: string[];
    patientExplanation: string;
    recommendations: string[];
  } | null;
  bloodReport: {
    uploaded: boolean;
    fileName?: string;
    indicators?: BloodIndicator[];
    summary?: string;
    aiExplanation?: string;
  } | null;
  status: 'completed' | 'processing' | 'pending';
  createdAt: number;
  isHidden?: boolean;
}

interface ReportContextType {
  reports: ReportData[];
  isDbReady: boolean;
  addReport: (report: ReportData) => void;
  getReport: (id: string) => ReportData | undefined;
  updateReport: (id: string, updates: Partial<ReportData>) => void;
  deleteReport: (id: string) => void;
  toggleHideReport: (id: string) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (!isMigrated()) {
          await importFromLocalStorage();
        }
        const loaded = await getAllReports();
        setReports(loaded);
      } catch (e) {
        console.error('IndexedDB load failed, falling back to localStorage', e);
        const raw = localStorage.getItem('medivoice_reports_v1');
        if (raw) {
          try { setReports(JSON.parse(raw)); } catch { /* ignore */ }
        }
      } finally {
        setIsDbReady(true);
      }
    };
    init();
  }, []);

  const addReport = (report: ReportData) => {
    setReports((prev) => [report, ...prev]);
    saveReport(report).then(() => console.log('Report saved to DB')).catch((e) => console.error('Failed to save report:', e));
  };

  const getReport = (id: string) => {
    return reports.find((r) => r.id === id);
  };

  const updateReport = (id: string, updates: Partial<ReportData>) => {
    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, ...updates } : report))
    );
    dbUpdateReport(id, updates).catch((e) => console.error('Failed to update report in IndexedDB', e));
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((report) => report.id !== id));
    dbDeleteReport(id).catch((e) => console.error('Failed to delete report from IndexedDB', e));
  };

  const toggleHideReport = (id: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, isHidden: !report.isHidden } : report
      )
    );
    const target = reports.find((r) => r.id === id);
    if (target) {
      dbUpdateReport(id, { isHidden: !target.isHidden }).catch((e) =>
        console.error('Failed to toggle hide in IndexedDB', e)
      );
    }
  };

  return (
    <ReportContext.Provider value={{ reports, isDbReady, addReport, getReport, updateReport, deleteReport, toggleHideReport }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}
