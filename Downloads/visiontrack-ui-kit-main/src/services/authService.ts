import { apiRequest, API_ENDPOINTS } from '@/config/api';
import type { LoginCredentials, AuthResponse, ApiResponse } from '@/types/models';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiRequest<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.auth.login,
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      // Store tokens
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_role', response.data.user.role);
      }
      
      // Store refresh token if provided
      if (response.data.refresh || (response.data as any).refreshToken) {
        localStorage.setItem('refresh_token', response.data.refresh || (response.data as any).refreshToken);
      }

      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiRequest<ApiResponse<void>>(API_ENDPOINTS.auth.logout, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear local storage regardless
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
    }
  },

  // Verify token
  async verifyToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;

      await apiRequest<ApiResponse<void>>(API_ENDPOINTS.auth.verify);
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  // Get user role
  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  },
};
