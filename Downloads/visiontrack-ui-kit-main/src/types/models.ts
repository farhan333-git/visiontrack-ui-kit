// Employee Types
export interface Employee {
  id: string;
  empId: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  name: string;
  email: string;
  empId: string;
  role: string;
  photo?: File | string;
  // Optional backend-specific fields
  first_name?: string;
  last_name?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  status?: 'Active' | 'Inactive';
}

// Face Registration Types
export interface FaceData {
  id: string;
  employeeId: string;
  faceEncoding: string;
  capturedAt: string;
  imageUrl?: string;
}

export interface RegisterFaceDto {
  employeeId: string;
  imageData: string | File;
  captureMethod: 'webcam' | 'upload';
}

export interface VerifyFaceDto {
  imageData: string | File;
}

export interface FaceVerificationResult {
  recognized: boolean;
  employeeId?: string;
  employeeName?: string;
  confidence: number;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  status: 'Present' | 'Late' | 'Absent';
  photo?: string;
  verificationMethod: 'face' | 'manual';
}

export interface MarkAttendanceDto {
  employeeId: string;
  timestamp?: string;
  imageData?: string | File;
}

export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

// Report Types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: 'Present' | 'Late' | 'Absent';
}

export interface ReportData {
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  };
  records: AttendanceRecord[];
  monthlyData?: MonthlyAttendanceData[];
}

export interface MonthlyAttendanceData {
  month: string;
  present: number;
  absent: number;
  late: number;
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  filters: ReportFilter;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  role: 'admin' | 'employee';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}
