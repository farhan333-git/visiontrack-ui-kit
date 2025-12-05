import { apiRequest, API_ENDPOINTS } from '@/config/api';
import type {
  AttendanceRecord,
  MarkAttendanceDto,
  AttendanceStats,
  ApiResponse,
  PaginatedResponse,
} from '@/types/models';

export const attendanceService = {
  // Get all attendance records
  async getAll(params?: {
    date?: string;
    employeeId?: string;
    limit?: number;
  }): Promise<AttendanceRecord[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.employeeId) queryParams.append('employee_id', params.employeeId);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${API_ENDPOINTS.attendance.list}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const response = await apiRequest<PaginatedResponse<AttendanceRecord>>(url);
      return response.results;
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      throw error;
    }
  },

  // Get attendance configuration (start_time, end_time, late_buffer_minutes)
  async getConfig(): Promise<{ start_time: string; end_time: string; late_buffer_minutes: number } | null> {
    try {
      const response = await apiRequest<any>(API_ENDPOINTS.attendance.config, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch attendance config:', error);
      // Rethrow so callers can handle authentication/authorization errors
      throw error;
    }
  },

  async updateConfig(payload: { start_time: string; end_time: string; late_buffer_minutes: number }) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest<any>(API_ENDPOINTS.attendance.config, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error) {
      console.error('Failed to update attendance config:', error);
      throw error;
    }
  },

  // Stats: summary (cards + pie chart)
  async getSummary(month?: number) {
    try {
      const token = localStorage.getItem('auth_token');
      const url = month ? `${API_ENDPOINTS.attendance.statsSummary}?month=${month}` : API_ENDPOINTS.attendance.statsSummary;
      const response = await apiRequest<any>(url, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error);
      throw error;
    }
  },

  async getDaily() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest<any>(API_ENDPOINTS.attendance.statsDaily, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
      throw error;
    }
  },

  async getEmployeesStats() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest<any>(API_ENDPOINTS.attendance.statsEmployees, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch employees stats:', error);
      throw error;
    }
  },

  async getTodayLogs() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest<any>(API_ENDPOINTS.attendance.logsToday, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch today logs:', error);
      throw error;
    }
  },

  async notifyEmployee(employeeId: string, messageType: string) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiRequest<any>(API_ENDPOINTS.attendance.notify, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
        body: JSON.stringify({ employee_id: employeeId, message_type: messageType }),
      });
      return response;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  },

  // Get today's attendance
  async getToday(): Promise<AttendanceRecord[]> {
    try {
      const response = await apiRequest<PaginatedResponse<AttendanceRecord>>(
        API_ENDPOINTS.attendance.today
      );
      return response.results;
    } catch (error) {
      console.error('Failed to fetch today\'s attendance:', error);
      throw error;
    }
  },

  // Get attendance by employee
  async getByEmployee(employeeId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceRecord[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('start_date', params.startDate);
      if (params?.endDate) queryParams.append('end_date', params.endDate);

      const url = `${API_ENDPOINTS.attendance.byEmployee(employeeId)}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const response = await apiRequest<PaginatedResponse<AttendanceRecord>>(url);
      return response.results;
    } catch (error) {
      console.error(`Failed to fetch attendance for employee ${employeeId}:`, error);
      throw error;
    }
  },

  // Mark attendance
  async mark(data: MarkAttendanceDto): Promise<AttendanceRecord> {
    try {
      const formData = new FormData();
      formData.append('employeeId', data.employeeId);
      
      if (data.timestamp) {
        formData.append('timestamp', data.timestamp);
      }

      if (data.imageData instanceof File) {
        formData.append('image', data.imageData);
      } else if (typeof data.imageData === 'string') {
        formData.append('imageData', data.imageData);
      }

      const response = await apiRequest<ApiResponse<AttendanceRecord>>(
        API_ENDPOINTS.attendance.mark,
        {
          method: 'POST',
          body: formData,
          headers: {},
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      throw error;
    }
  },

  // Get attendance statistics
  async getStats(date?: string): Promise<AttendanceStats> {
    try {
      const url = date
        ? `${API_ENDPOINTS.reports.stats}?date=${date}`
        : API_ENDPOINTS.reports.stats;

      const response = await apiRequest<ApiResponse<AttendanceStats>>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error);
      throw error;
    }
  },

  // Mark attendance via face recognition
  async markViaFaceRecognition(imageData: string | File): Promise<AttendanceRecord> {
    try {
      const formData = new FormData();

      if (imageData instanceof File) {
        formData.append('image', imageData);
      } else {
        formData.append('imageData', imageData);
      }

      const response = await apiRequest<ApiResponse<AttendanceRecord>>(
        API_ENDPOINTS.attendance.mark,
        {
          method: 'POST',
          body: formData,
          headers: {},
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark attendance via face recognition:', error);
      throw error;
    }
  },
};
