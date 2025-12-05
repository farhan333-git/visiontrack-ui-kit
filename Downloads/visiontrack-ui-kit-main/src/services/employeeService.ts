import { apiRequest, API_ENDPOINTS, ApiError } from '@/config/api';
import type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ApiResponse,
  PaginatedResponse,
} from '@/types/models';

export const employeeService = {
  // Get all employees
  async getAll(): Promise<Employee[]> {
    try {
      const response = await apiRequest<PaginatedResponse<Employee>>(
        API_ENDPOINTS.employees.list
      );
      return response.results;
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  },

  // Get employees with pagination and optional search
  async getPaginated(params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<Employee>> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.pageSize) query.append('page_size', String(params.pageSize));
      if (params?.search) query.append('search', params.search);

      const url = `${API_ENDPOINTS.employees.list}${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiRequest<PaginatedResponse<Employee>>(url);
      return response;
    } catch (error) {
      console.error('Failed to fetch employees (paginated):', error);
      throw error;
    }
  },

  // Get single employee by ID
  async getById(id: string): Promise<Employee> {
    try {
      const response = await apiRequest<ApiResponse<Employee>>(
        API_ENDPOINTS.employees.detail(id)
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch employee ${id}:`, error);
      throw error;
    }
  },

  // Create new employee
  async create(data: CreateEmployeeDto): Promise<Employee> {
    try {
      const formData = new FormData();
      // Prefer backend fields first_name/last_name; fall back to name split
      const anyData = data as unknown as { first_name?: string; last_name?: string };
      const fullName = data.name || '';
      const firstName = anyData.first_name ?? (fullName ? fullName.split(' ')[0] : '');
      const lastName = anyData.last_name ?? (fullName ? fullName.split(' ').slice(1).join(' ') : '');

      if (firstName) formData.append('first_name', firstName);
      if (lastName) formData.append('last_name', lastName);
      if (data.name) formData.append('name', data.name); // optional compatibility
      formData.append('email', data.email);
      formData.append('empId', data.empId);
      if (data.role) formData.append('role', data.role);
      
      if (data.photo instanceof File) {
        formData.append('photo', data.photo);
      }

      const response = await apiRequest<ApiResponse<Employee>>(
        API_ENDPOINTS.employees.create,
        {
          method: 'POST',
          body: formData,
          headers: {}, // Let browser set Content-Type for FormData
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  },

  // Update employee
  async update(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    try {
      const formData = new FormData();
      
      if (data.name) formData.append('name', data.name);
      if (data.email) formData.append('email', data.email);
      if (data.empId) formData.append('empId', data.empId);
      if (data.role) formData.append('role', data.role);
      if (data.status) formData.append('status', data.status);
      if (data.photo instanceof File) formData.append('photo', data.photo);

      const response = await apiRequest<ApiResponse<Employee>>(
        API_ENDPOINTS.employees.update(id),
        {
          method: 'PATCH',
          body: formData,
          headers: {},
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update employee ${id}:`, error);
      throw error;
    }
  },

  // Delete employee
  async delete(id: string): Promise<void> {
    try {
      await apiRequest<ApiResponse<void>>(
        API_ENDPOINTS.employees.delete(id),
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      console.error(`Failed to delete employee ${id}:`, error);
      throw error;
    }
  },

  // Search employees
  async search(query: string): Promise<Employee[]> {
    try {
      const response = await apiRequest<PaginatedResponse<Employee>>(
        `${API_ENDPOINTS.employees.list}?search=${encodeURIComponent(query)}`
      );
      return response.results;
    } catch (error) {
      console.error('Failed to search employees:', error);
      throw error;
    }
  },
};
