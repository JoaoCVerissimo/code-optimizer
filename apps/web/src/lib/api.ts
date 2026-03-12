import type {
  CreateSubmissionRequest,
  CreateSubmissionResponse,
  SubmissionDetailResponse,
  ListSubmissionsResponse,
  SubmissionStatusResponse,
} from "@code-optimizer/shared";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `API error: ${res.status}`,
    );
  }

  return res.json() as Promise<T>;
}

export function createSubmission(
  data: CreateSubmissionRequest,
): Promise<CreateSubmissionResponse> {
  return apiFetch("/api/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSubmission(id: string): Promise<SubmissionDetailResponse> {
  return apiFetch(`/api/submissions/${encodeURIComponent(id)}`);
}

export function getSubmissionStatus(
  id: string,
): Promise<SubmissionStatusResponse> {
  return apiFetch(`/api/submissions/${encodeURIComponent(id)}/status`);
}

export function listSubmissions(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ListSubmissionsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  return apiFetch(`/api/submissions${qs ? `?${qs}` : ""}`);
}
