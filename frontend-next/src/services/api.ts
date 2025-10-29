import { AdminDashboardResponse, AdminEmployeeSummary, EmployeeDashboardResponse, AdminMetrics } from '@/types/dashboard';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }
  return response.json();
}

export async function fetchEmployeeDashboard(): Promise<EmployeeDashboardResponse> {
  const res = await fetch('/api/employee/dashboard', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<EmployeeDashboardResponse>(res);
}

export async function fetchEmployeeDetails(id: string): Promise<EmployeeDashboardResponse> {
  const res = await fetch(`/api/employee/dashboard/details/${id}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<EmployeeDashboardResponse>(res);
}

export async function fetchAdminOverview(): Promise<AdminDashboardResponse> {
  const res = await fetch('/api/admin/overview', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<AdminDashboardResponse>(res);
}

export async function fetchAdminEmployee(id: string): Promise<EmployeeDashboardResponse> {
  const res = await fetch(`/api/admin/employee/${id}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<EmployeeDashboardResponse>(res);
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await fetch('/api/admin/metrics', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<AdminMetrics>(res);
}
