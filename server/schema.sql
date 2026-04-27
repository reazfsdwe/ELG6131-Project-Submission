CREATE TABLE IF NOT EXISTS reports (
  pk BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at BIGINT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  patient JSONB NOT NULL,
  transcripts JSONB NOT NULL DEFAULT '[]',
  ai_analysis JSONB,
  blood_report JSONB
);

CREATE INDEX IF NOT EXISTS idx_reports_report_id ON reports(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
