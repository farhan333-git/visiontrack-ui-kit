import { apiRequest, API_ENDPOINTS } from '@/config/api';
import type {
  ReportData,
  ReportFilter,
  ExportOptions,
  MonthlyAttendanceData,
  ApiResponse,
} from '@/types/models';

export const reportService = {
  // Generate report with filters
  async generate(filters: ReportFilter): Promise<ReportData> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('start_date', filters.startDate);
      if (filters.endDate) queryParams.append('end_date', filters.endDate);
      if (filters.employeeId) queryParams.append('employee_id', filters.employeeId);
      if (filters.status) queryParams.append('status', filters.status);

      const url = `${API_ENDPOINTS.reports.generate}?${queryParams.toString()}`;

      const response = await apiRequest<ApiResponse<ReportData>>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  },

  // Get monthly attendance data
  async getMonthly(year: number, month?: number): Promise<MonthlyAttendanceData[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('year', year.toString());
      if (month) queryParams.append('month', month.toString());

      const url = `${API_ENDPOINTS.reports.monthly}?${queryParams.toString()}`;

      const response = await apiRequest<ApiResponse<MonthlyAttendanceData[]>>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch monthly data:', error);
      throw error;
    }
  },

  // Export report
  async export(options: ExportOptions): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', options.format);
      
      if (options.filters.startDate) {
        queryParams.append('start_date', options.filters.startDate);
      }
      if (options.filters.endDate) {
        queryParams.append('end_date', options.filters.endDate);
      }
      if (options.filters.employeeId) {
        queryParams.append('employee_id', options.filters.employeeId);
      }
      if (options.filters.status) {
        queryParams.append('status', options.filters.status);
      }

      const url = `${API_ENDPOINTS.reports.export}?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  },

  // Download exported report
  downloadReport(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Export to CSV
  async exportToCSV(filters: ReportFilter): Promise<void> {
    try {
      const blob = await this.export({ format: 'csv', filters });
      const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      this.downloadReport(blob, filename);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw error;
    }
  },

  // Export to PDF
  async exportToPDF(filters: ReportFilter): Promise<void> {
    try {
      const blob = await this.export({ format: 'pdf', filters });
      const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`;
      this.downloadReport(blob, filename);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw error;
    }
  },
};
