import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { logout as logoutService } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supabase.token');
      if (token) {
        const decodedToken = jwtDecode(token);
        // Check if token is expired
        if (decodedToken.exp * 1000 > Date.now()) {
          const userData = {
            id: decodedToken.sub,
            email: decodedToken.email,
            role: decodedToken.role,
            company_id: decodedToken.company_id
          };
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token is expired
          localStorage.removeItem('supabase.token');
        }
      }
    } catch (error) {
      console.error('Error processing token:', error);
      localStorage.removeItem('supabase.token');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    await logoutService();
    setUser(null);
    setIsAuthenticated(false);
    // Optional: redirect to login page
    window.location.href = '/';
  };

  const value = {
    user,
    isAuthenticated,
    logout,
    profile: user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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
