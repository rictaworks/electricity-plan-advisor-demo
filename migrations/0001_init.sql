-- SPEC 2章 ER図に対応する D1（SQLite）スキーマ。
-- 旧 FastAPI 版（backend/app/models）の列定義・外部キー（ON DELETE CASCADE）をそのまま移植する。
-- 全テーブルが session_id を持ち、参照条件には必ず session_id を含める（CLAUDE.md セキュリティ事項）。

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_accessed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS household_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL,
  age_group_json TEXT NOT NULL,
  stay_home_pattern TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_household_profiles_session ON household_profiles(session_id);

CREATE TABLE IF NOT EXISTS usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  kwh_actual REAL,
  kwh_estimated REAL,
  kwh_used REAL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_usage_records_session ON usage_records(session_id);

CREATE TABLE IF NOT EXISTS plan_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  region TEXT NOT NULL,
  ampere INTEGER NOT NULL,
  base_fee REAL NOT NULL,
  unit_price_1 REAL NOT NULL,
  threshold_1 REAL NOT NULL,
  unit_price_2 REAL NOT NULL,
  threshold_2 REAL NOT NULL,
  unit_price_3 REAL NOT NULL,
  has_time_based INTEGER NOT NULL DEFAULT 0,
  night_discount_rate REAL NOT NULL DEFAULT 0,
  bank_discount REAL NOT NULL DEFAULT 0,
  renewable_surcharge INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS calculation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plan_master(id) ON DELETE CASCADE,
  annual_total REAL NOT NULL,
  monthly_avg REAL NOT NULL,
  saving_vs_standard REAL NOT NULL,
  recommendation_reason TEXT NOT NULL,
  is_unsuitable INTEGER NOT NULL DEFAULT 0,
  calculated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calculation_results_session ON calculation_results(session_id);
