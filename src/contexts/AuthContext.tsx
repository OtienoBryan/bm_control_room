import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  client_id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void | Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Set flag to indicate we're initializing (prevents API interceptor from clearing auth)
        sessionStorage.setItem('auth_initializing', 'true');
        
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (savedUser && token) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Restore user state immediately
            setUser(parsedUser);
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          // No saved auth, clear any stale data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error initializing auth from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        // Mark loading as complete
        setIsLoading(false);
        // Clear initialization flag after a delay to allow components to mount
        // This gives time for ProtectedRoute and other components to check auth state
        // and for any initial API calls to complete
        setTimeout(() => {
          sessionStorage.removeItem('auth_initializing');
        }, 1000);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Get user info before clearing
      const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
      
      // Call logout endpoint to log the action
      if (currentUser) {
        try {
          await api.post('/auth/logout', {
            userId: currentUser.id,
            username: currentUser.username
          });
        } catch (error) {
          // Don't block logout if audit logging fails
          console.error('Error logging logout to server:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 