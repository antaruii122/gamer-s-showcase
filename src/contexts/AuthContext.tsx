import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ADMIN_CREDENTIALS } from "@/types/catalog";
import { getAdminSession, setAdminSession, clearAdminSession } from "@/utils/localStorage";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  checkSession: () => boolean;
  isLoading: boolean; // Alias for backward compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSession = (): boolean => {
    const session = getAdminSession();
    if (session?.loggedIn) {
      setIsAuthenticated(true);
      return true;
    } else {
      // Session expired or invalid - auto-logout
      clearAdminSession();
      setIsAuthenticated(false);
      return false;
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
    setLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      setAdminSession();
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: "Credenciales incorrectas" };
  };

  const logout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loading, 
      login, 
      logout, 
      checkSession,
      isLoading: loading // Alias
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
