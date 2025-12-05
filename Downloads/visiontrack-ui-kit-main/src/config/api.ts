// Django Backend API Configuration
const API_BASE_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api';
const API_BASE_URL1 = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/core/api';
const API_BASE_URL2 = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/';
export const API_ENDPOINTS = {
  // Employee endpoints
  employees: {
    list: `${API_BASE_URL1}/employees/`,
    create: `${API_BASE_URL1}/employees/`,
    detail: (id: string) => `${API_BASE_URL1}/employees/${id}/`,
    update: (id: string) => `${API_BASE_URL1}/employees/${id}/`,
    delete: (id: string) => `${API_BASE_URL1}/employees/${id}/`,
    check: `${API_BASE_URL1}/employees/check/`,
  },
  // Face registration endpoints
  faces: {
    register: `${API_BASE_URL}/faces/register/`,
    upload: `${API_BASE_URL}/faces/upload/`,
    verify: `${API_BASE_URL}/faces/verify/`,
    coreUpload: `${API_BASE_URL2}/core/upload/`,
  },
  // Attendance endpoints
  attendance: {
    list: `${API_BASE_URL}/attendance/`,
    mark: `${API_BASE_URL}/attendance/mark/`,
    today: `${API_BASE_URL}/attendance/today/`,
    byEmployee: (employeeId: string) => `${API_BASE_URL}/attendance/employee/${employeeId}/`,
    // Extended attendance endpoints (Django attendenceapp)
    config: `${API_BASE_URL}/attendance/config/`,
    statsSummary: `${API_BASE_URL}/attendance/stats/summary/`,
    statsDaily: `${API_BASE_URL}/attendance/stats/daily/`,
    statsEmployees: `${API_BASE_URL}/attendance/stats/employees/`,
    logsToday: `${API_BASE_URL}/attendance/logs/today/`,
    notify: `${API_BASE_URL}/attendance/notify/`,
  },
  // Report endpoints
  reports: {
    generate: `${API_BASE_URL}/reports/generate/`,
    monthly: `${API_BASE_URL}/reports/monthly/`,
    export: `${API_BASE_URL}/reports/export/`,
    stats: `${API_BASE_URL}/reports/stats/`,
  },
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login/`,
    logout: `${API_BASE_URL}/auth/logout/`,
    verify: `${API_BASE_URL2}auth/verify/`,
    refresh: `${API_BASE_URL}/token/refresh/`,
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    // Prefer localStorage token, fallback to cookie named 'access_token'
    let token = localStorage.getItem('auth_token');
    if (!token) {
      const match = typeof document !== 'undefined' && document.cookie
        ? document.cookie.match(new RegExp('(^| )access_token=([^;]+)'))
        : null;
      if (match) token = match[2];
    }

    const isFormData = options.body instanceof FormData;

    // Build headers: do NOT set Content-Type for FormData so browser can add boundaries
    const baseHeaders: HeadersInit = {};
    if (!isFormData) {
      baseHeaders['Content-Type'] = 'application/json';
    }
    if (token) {
      baseHeaders['Authorization'] = `JWT ${token}`;
    }
    const headers: HeadersInit = {
      ...baseHeaders,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 and we have a refresh token, try refreshing
    if (response.status === 401) {
      let refreshToken = localStorage.getItem('refresh_token');
      
      // Also check cookies for refresh_token
      if (!refreshToken && typeof document !== 'undefined' && document.cookie) {
        const refreshMatch = document.cookie.match(new RegExp('(^| )refresh_token=([^;]+)'));
        if (refreshMatch) refreshToken = refreshMatch[2];
      }
      
      if (refreshToken && url !== API_ENDPOINTS.auth.refresh) {
        try {
          const refreshResponse = await fetch(API_ENDPOINTS.auth.refresh, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            const newAccessToken = data.access || data.token;
            const newRefreshToken = data.refresh || data.refreshToken;
            
            if (newAccessToken) {
              localStorage.setItem('auth_token', newAccessToken);
              
              // Update refresh token if provided
              if (newRefreshToken) {
                localStorage.setItem('refresh_token', newRefreshToken);
                
                // Also update cookie if it exists
                if (typeof document !== 'undefined' && document.cookie.includes('refresh_token=')) {
                  document.cookie = `refresh_token=${newRefreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
                }
              }
              
              // Retry original request with new token
              const retryHeaders = { ...headers, Authorization: `JWT ${newAccessToken}` };
              const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
              
              if (retryResponse.ok) {
                return await retryResponse.json();
              }
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      // If refresh failed or no refresh token, clear tokens and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      
      // Clear cookies
      if (typeof document !== 'undefined') {
        document.cookie = 'access_token=; Max-Age=0; path=/;';
        document.cookie = 'refresh_token=; Max-Age=0; path=/;';
      }
      
      window.location.href = '/login';
      throw new ApiError('Session expired. Please login again.', 401);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP error ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
};
