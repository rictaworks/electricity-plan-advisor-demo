import reasonTemplatesJson from "./seed/reason_templates.json";

/** 推薦理由の定型文（SPEC 8.3 F8：テンプレートベース）。旧 FastAPI 版の JSON をそのまま読む。 */
export interface ReasonTemplates {
  high_saving: string;
  moderate_saving: string;
  night_time_based: string;
  bank_discount: string;
  renewable: string;
  standard: string;
  unsuitable_time_based: string;
  high_saving_threshold: number;
}

export const REASON_TEMPLATES: ReasonTemplates = reasonTemplatesJson;
