import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      setUser(storedUser);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Hardcoded credentials check
    if (username === 'tbwa' && password === 'smp') {
      setIsAuthenticated(true);
      setUser(username);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authUser', username);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authUser');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};