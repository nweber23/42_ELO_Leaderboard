import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  user_id: number;
  login: string;
  email: string;
  first_name: string;
  last_name: string;
  image_url: string;
  campus: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const response = await fetch('/api/auth/login');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      
      const data = await response.json();
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Check for successful authentication from callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      // Remove the auth parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh auth status
      checkAuth();
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};