import { Assignment, AssignmentFormData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    // Don't set Content-Type for FormData — browser sets it with boundary automatically
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json.data as T;
}

async function requestBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const json = await res.json();
      msg = json?.error || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return await res.blob();
}

export const api = {
  getAssignments(): Promise<Assignment[]> {
    return request<Assignment[]>('/api/assignments');
  },

  getAssignment(id: string): Promise<Assignment> {
    return request<Assignment>(`/api/assignments/${id}`);
  },

  createAssignment(
    formData: AssignmentFormData,
    file?: File | null,
  ): Promise<{ assignmentId: string; jobId: string }> {
    if (file) {
      const body = new FormData();
      body.append('formData', JSON.stringify(formData));
      body.append('file', file);
      return request<{ assignmentId: string; jobId: string }>('/api/assignments', {
        method: 'POST',
        body,
      });
    }
    return request<{ assignmentId: string; jobId: string }>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify({ formData }),
    });
  },

  regenerateAssignment(
    id: string
  ): Promise<{ assignmentId: string; jobId: string }> {
    return request<{ assignmentId: string; jobId: string }>(
      `/api/assignments/${id}/regenerate`,
      { method: 'POST' }
    );
  },

  deleteAssignment(id: string): Promise<void> {
    return request<void>(`/api/assignments/${id}`, { method: 'DELETE' });
  },

  downloadPdf(
    id: string,
    variant: 'paper' | 'key' | 'both'
  ): Promise<Blob> {
    return requestBlob(`/api/assignments/${id}/pdf?variant=${variant}`);
  },
};
