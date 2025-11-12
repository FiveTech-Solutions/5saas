import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { getUserProfile, logUserAction } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser({ id: session.user.id, email: session.user.email, ...profile });
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser({ id: session.user.id, email: session.user.email, ...profile });
            setIsAuthenticated(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser({ id: session.user.id, email: session.user.email, ...profile });
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      await logUserAction('logout');
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        if (profile) {
          setUser({ id: currentUser.id, email: currentUser.email, ...profile });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    logout,
    refreshUser,
    profile: user,
    setUser,
    setIsAuthenticated
  }), [user, isAuthenticated, loading, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
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
