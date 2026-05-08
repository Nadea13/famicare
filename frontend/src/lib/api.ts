/**
 * api.ts
 * ───────────────
 * Shared API client for FamiCare Dashboard.
 * Handles authentication headers and base URL configuration.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('famicare_token') : null;

  const headers: any = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('famicare_token');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
}

// Typed helpers
export const api = {
  getProfile: () => fetchWithAuth('/auth/profile'),
  getStats: () => fetchWithAuth('/dashboard/stats'),
  getPatients: () => fetchWithAuth('/patient-management'),
  createPatient: (data: any) => fetchWithAuth('/patient-management', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updatePatient: (patientId: string, data: any) => fetchWithAuth(`/patient-management/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getMembers: () => fetchWithAuth('/members'),
  setPrimaryPatient: (patientId: string) => fetchWithAuth('/auth/profile/primary', {
    method: 'PUT',
    body: JSON.stringify({ patient_id: patientId })
  }),
  deletePatient: (patientId: string) => fetchWithAuth(`/patient-management/${patientId}`, {
    method: 'DELETE'
  }),
  deleteProfile: () => fetchWithAuth('/auth/profile', {
    method: 'DELETE'
  }),
};
