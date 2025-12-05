import { apiRequest, API_ENDPOINTS } from '@/config/api';
import type {
  FaceData,
  RegisterFaceDto,
  VerifyFaceDto,
  FaceVerificationResult,
  ApiResponse,
} from '@/types/models';

export const faceService = {
  // Register face for employee
  async register(data: RegisterFaceDto): Promise<FaceData> {
    try {
      const formData = new FormData();
      formData.append('employeeId', data.employeeId);
      formData.append('captureMethod', data.captureMethod);

      if (data.imageData instanceof File) {
        formData.append('image', data.imageData);
      } else if (typeof data.imageData === 'string') {
        // Base64 image data from webcam
        formData.append('imageData', data.imageData);
      }

      const response = await apiRequest<ApiResponse<FaceData>>(
        API_ENDPOINTS.faces.register,
        {
          method: 'POST',
          body: formData,
          headers: {},
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to register face:', error);
      throw error;
    }
  },

  // Upload face image
  async uploadFaceImage(file: File, employeeId: string): Promise<FaceData> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('employeeId', employeeId);

      const response = await apiRequest<ApiResponse<FaceData>>(
        API_ENDPOINTS.faces.upload,
        {
          method: 'POST',
          body: formData,
          headers: {},
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload face image:', error);
      throw error;
    }
  },

  // Verify face and identify employee
  async verify(data: VerifyFaceDto): Promise<FaceVerificationResult> {
    try {
      const formData = new FormData();

      if (data.imageData instanceof File) {
        formData.append('image', data.imageData);
      } else if (typeof data.imageData === 'string') {
        formData.append('imageData', data.imageData);
      }

      const response = await apiRequest<ApiResponse<FaceVerificationResult>>(
        API_ENDPOINTS.faces.verify,
        {
          method: 'POST',
          body: formData,
          headers: {},
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to verify face:', error);
      throw error;
    }
  },

  // Convert canvas to blob for upload
  canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  },

  // Convert canvas to base64
  canvasToBase64(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/jpeg', 0.95);
  },
};
