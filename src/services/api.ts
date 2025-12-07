import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';

// Enhanced type definitions
export type RequestConfig<T = any> = AxiosRequestConfig<T>;
export type Response<T = any, D = any> = AxiosResponse<T, D>;
export type ApiResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
};

export interface ApiError extends Error {
  status: number;
  message: string;
  details?: any;
  code?: string;
  response?: any;
  config?: any;
  isAxiosError?: boolean;
  toJSON?: () => object;
  
  // Allow any other properties since we're extending Error
  [key: string]: any;
}

// Validate and get API base URL
const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  console.log('API base URL:', url);
  
  // Check if we're in production (deployed on Vercel)
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  
  // Default fallback URLs
  const defaultUrl = isProduction ? '/api' : 'http://localhost:5005/api';
  
  if (!url) {
    console.warn(`VITE_API_URL is not defined, falling back to ${defaultUrl}`);
    return defaultUrl;
  }
  
  // If URL is relative (starts with /), use it as is (for Vercel proxy)
  if (url.startsWith('/')) {
    return url;
  }
  
  // Validate URL format for absolute URLs
  try {
    new URL(url);
  } catch (error) {
    console.error('Invalid VITE_API_URL format:', url, error);
    return defaultUrl;
  }
  
  // Ensure URL ends with /api for absolute URLs
  if (!url.endsWith('/api')) {
    return url + '/api';
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();
console.log('Using API base URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
  withCredentials: false // Disable credentials for CORS
});

// Single request interceptor for authentication and debugging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authentication token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added auth token to request:', {
        token: token.substring(0, 10) + '...',
        headers: config.headers
      });
    } else {
      console.warn('No auth token found in localStorage');
    }

    // Log request details
    console.log('Making request to:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers,
      data: config.data
    });

    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Single response interceptor for handling errors and debugging
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse<any> => {
    console.log('Received response:', response.status, response.data);
    return response;
  },
  async (error: unknown): Promise<never> => {
    console.error('Response error:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 408;
        timeoutError.code = 'timeout';
        (timeoutError as any).details = error.config;
        throw timeoutError;
      }

      if (!error.response) {
        const networkError = new Error(error.message || 'Network error') as ApiError;
        networkError.status = 0;
        networkError.code = 'network';
        throw networkError;
      }

      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Check if we're in the middle of auth initialization
          const isInitializing = sessionStorage.getItem('auth_initializing') === 'true';
          const currentPath = window.location.pathname;
          const token = localStorage.getItem('token');
          const user = localStorage.getItem('user');
          
          // Don't clear auth during initialization - this prevents redirects on page refresh
          if (isInitializing) {
            console.warn('Received 401 during auth initialization, preserving auth state');
            // Return error but don't clear auth or redirect
            const authError = new Error('Unauthorized during initialization') as ApiError;
            authError.status = 401;
            authError.code = 'auth-init';
            throw authError;
          }
          
          // Only clear auth if we're not already on the login page and have auth data
          if (currentPath !== '/login' && !currentPath.startsWith('/login') && token && user) {
            console.log('Unauthorized access (401), clearing token and redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Use a small delay to ensure state updates properly
            setTimeout(() => {
              // Only redirect if we're still not on login page and not initializing
              if (window.location.pathname !== '/login' && 
                  !sessionStorage.getItem('auth_initializing')) {
                window.location.href = '/login';
              }
            }, 100);
          }
          break;
        case 403:
        case 404:
        case 500:
          break;
      }

      const errorData = new Error(
        typeof data === 'object' && data !== null && 'message' in data 
          ? (data as { message: string }).message 
          : 'An error occurred'
      ) as ApiError;
      
      errorData.status = status;
      errorData.code = `http-${status}`;
      (errorData as any).response = error.response;
      
      if (typeof data === 'object' && data !== null) {
        (errorData as any).details = data;
      }
      
      throw errorData;
    }

    const unknownError = new Error(
      error instanceof Error ? error.message : 'An unknown error occurred'
    ) as ApiError;
    unknownError.status = 500;
    unknownError.code = 'unknown';
    
    if (error instanceof Error) {
      unknownError.stack = error.stack;
    }
    
    throw unknownError;
  }
);

// Enhanced utility functions with better typing
export const get = async <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.get<T>(url, config);
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
};

export const post = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.post<T>(url, data, config);
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
};

export const put = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.put<T>(url, data, config);
  return response;
};

export const patch = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.patch<T>(url, data, config);
  return response;
};

export const del = async <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.delete<T>(url, config);
  return response;
};

export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
};

export default api;
