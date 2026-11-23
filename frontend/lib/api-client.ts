/** Typed browser client for the documented FastAPI v1 contract. */
export type ApiError = { error: { code: string; message: string; details?: unknown }; detail?: string };

export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly body: ApiError) {
    super(body.error?.message || body.detail || "Request failed");
  }
}

export type CopilotRequest = { course_id: string; query: string };
export type CopilotResponse = { grounded: boolean; answer: string; citations: string[]; concept_code: string | null };
export type ZkProofRequest = { group_id: string; identity_commitment: string; nullifier_hash: string; external_nullifier: string; signal: string; proof?: Record<string, unknown> };
export type MarkImportRow = { student_identifier: string; question_scores: Record<string, number | null>; reported_total?: number | null };
export type MarkImportPreview = { import_id: string; status: string; total_rows: number; valid_rows: number; invalid_rows: number; rows: Array<{ row_index: number; student_identifier: string; student_name?: string; question_scores: Record<string, number>; calculated_total: number; errors: Array<{ field: string; error: string }>; is_valid: boolean }>; issues: unknown[]; confirmation_required: boolean; ocr_review_required?: boolean; low_confidence?: boolean; schema_preview?: { ocr_confidence?: number } };
export type MarksCsvRequest = { course_id: string; rows?: MarkImportRow[]; csv_text?: string; xlsx_base64?: string; idempotency_key?: string; source_name?: string };
export type PhotoMarksRequest = { course_id: string; image_base64: string; idempotency_key?: string; source_name?: string };
export type GradingSimulationRequest = { course_id: string; method?: "absolute" | "relative" | "gap_aware"; epsilon?: number; delta_min?: number };
export type WhatIfRequest = { student_id: string; course_id?: string; study_hours: Record<string, number> };
export type StudyPlanRequest = { student_id: string; available_hours?: number };
export type PaperAuditRequest = { course_id: string; exam_title?: string; questions?: Array<{ q_num: number; text: string; marks: number; bloom_level: string; concept_code: string; point_biserial_r?: number }> };
export type AttendanceScanRequest = { course_id?: string; student_id?: string; hmac_token: string; device_hash: string; latitude?: number; longitude?: number };
export type EquipmentForecast = { tenant_id: string; assets_monitored: number; critical_count: number; warning_count: number; ranked_forecast: Array<{ asset_tag: string; name: string; risk_tier: string; failure_prob_14d_pct: number }> };
export type DktAnalytics = { overall_mastery_pct: number; risk_level: string; concepts: Array<{ id: string; name: string; mastery_pct: number; attempts: number; confidence: string; warning: string; prerequisites: string[] }>; edges: Array<{ source: string; target: string }>; prerequisite_blockers: Array<{ concept_id: string; concept_name: string; mastery_pct: number; root_cause: string; path_from_target: string[] }>; recommended_next_steps: string[]; model: { name: string; status: string; dkt_lstm: { status: string; reason: string } } };
export type GrievanceRequest = { category: "facilities" | "sensitive_zk"; title: string; description: string; location: string; nullifier_hash?: string; zk_token?: string };
export type GrievanceResponse = { ticket_type: string; ticket_id?: string; tracking_code?: string; status: string; message: string };
export type ScheduleRequest = { tenant_id?: string; cohort?: string; courses: string[]; available_slots: string[]; rooms: string[]; async_mode?: boolean };
export type JobStatus<T = unknown> = { job_id: string; kind: string; status: "queued" | "running" | "succeeded" | "failed"; result?: T; error?: ApiError["error"] };
export type ScheduleResult = { status: string; total_slots?: number; student_clashes?: number; solve_time_ms?: number; schedule?: unknown[]; timetable?: unknown[] };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    credentials: "same-origin",
  });
  const body = await response.json().catch(() => ({ error: { code: "INVALID_RESPONSE", message: "The service returned an invalid response." } }));
  if (!response.ok) throw new ApiClientError(response.status, body as ApiError);
  return body as T;
}

export const api = {
  zkProof: (payload: ZkProofRequest) => request<Record<string, unknown>>("auth/zk-proof", { method: "POST", body: JSON.stringify(payload) }),
  ingestMarksCsv: (payload: MarksCsvRequest) => request<MarkImportPreview>("marks/ingest-csv", { method: "POST", body: JSON.stringify(payload) }),
  ingestMarksPhoto: (payload: PhotoMarksRequest) => request<MarkImportPreview>("marks/ingest-photo", { method: "POST", body: JSON.stringify(payload) }),
  confirmMarksImport: (importId: string, rows?: MarkImportRow[]) => request<{ import_id: string; status: string; persisted_records?: number }>(`marks/imports/${encodeURIComponent(importId)}/confirm`, { method: "POST", body: JSON.stringify({ rows }) }),
  marksImportHistory: (courseId?: string) => request<Array<{ import_id: string; status: string; source_type: string; created_at: string }>>(`marks/imports${courseId ? `?course_id=${encodeURIComponent(courseId)}` : ""}`),
  simulateGrading: (payload: GradingSimulationRequest) => request<Record<string, unknown>>("grading/simulate", { method: "POST", body: JSON.stringify(payload) }),
  dktAnalytics: (studentId: string) => request<Record<string, unknown>>(`analytics/dkt/${encodeURIComponent(studentId)}`),
  studentDktAnalytics: (studentId: string, courseId: string) => request<DktAnalytics>(`analytics/dkt/${encodeURIComponent(studentId)}?course_id=${encodeURIComponent(courseId)}`),
  whatIf: (payload: WhatIfRequest) => request<Record<string, unknown>>("student/what-if", { method: "POST", body: JSON.stringify(payload) }),
  studyPlan: (payload: StudyPlanRequest) => request<Record<string, unknown>>("student/study-plan", { method: "POST", body: JSON.stringify(payload) }),
  auditPaper: (payload: PaperAuditRequest) => request<Record<string, unknown>>("paper/audit", { method: "POST", body: JSON.stringify(payload) }),
  copilot: (payload: CopilotRequest) => request<CopilotResponse>("copilot/ask", { method: "POST", body: JSON.stringify(payload) }),
  attendanceScan: (payload: AttendanceScanRequest) => request<Record<string, unknown>>("attendance/scan", { method: "POST", body: JSON.stringify(payload) }),
  equipmentForecast: () => request<EquipmentForecast>("admin/equipment/forecast"),
  submitGrievance: (payload: GrievanceRequest) => request<GrievanceResponse>("grievance/submit", { method: "POST", body: JSON.stringify(payload) }),
  solveSchedule: (payload: ScheduleRequest) => request<JobStatus | ScheduleResult>("schedule/solve", { method: "POST", body: JSON.stringify(payload) }),
  job: <T = unknown>(jobId: string) => request<JobStatus<T>>(`jobs/${encodeURIComponent(jobId)}`),
};
