import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ADMIN_CREDENTIALS } from "@/types/catalog";
import { getAdminSession, setAdminSession, clearAdminSession } from "@/utils/localStorage";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const session = getAdminSession();
    setIsAuthenticated(session?.loggedIn ?? false);
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      setAdminSession();
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: "Credenciales inválidas" };
  };

  const logout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
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
