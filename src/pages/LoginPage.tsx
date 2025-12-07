import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import axios from 'axios';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login attempt with username:', username);
      console.log('API base URL:', import.meta.env.VITE_API_URL);
      
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response received:', { 
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        data: response.data
      });

      if (response.data.token) {
        console.log('Login successful, setting auth token');
        login(response.data.token, response.data.user);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        console.error('Login response missing token');
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers
          }
        });
        if (error.response?.status === 401) {
          setError('Invalid username or password');
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (!error.response) {
          setError('No response from server. Please check your connection.');
        } else {
          setError('An unexpected error occurred');
        }
      } else {
        console.error('Non-Axios error:', error);
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="text-center">
          
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-8">
          <div className="flex justify-center">
            <img 
              src="/bm.jpeg" 
              alt="BM Security" 
              className="h-20 w-auto object-contain"
            />
          </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-600 p-2 mb-3">
                  <div className="flex">
                    <div className="ml-2">
                      <p className="text-[11px] text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="username" className="block text-[11px] font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-0.5">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-2 py-1 text-[11px] border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-0.5">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-2 py-1 text-[11px] border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-2.5 w-2.5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-1.5 block text-[11px] text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-[11px]">
                  <a href="#" className="font-medium text-red-600 hover:text-red-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-1 px-2.5 border border-transparent rounded-md shadow-sm text-[11px] font-medium text-white bg-blue-950 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;