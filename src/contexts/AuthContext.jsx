import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getUserProfile, logUserAction } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter sessão atual
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Buscar perfil completo do usuário
          const profile = await getUserProfile(session.user.id);
          
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              ...profile
            });
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

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth State Change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Log do login
            await logUserAction('login');
            
            // Buscar perfil completo
            const profile = await getUserProfile(session.user.id);
            console.log('Profile loaded:', profile);
            
            if (profile) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                ...profile
              };
              console.log('Setting user:', userData);
              setUser(userData);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('Erro ao processar login:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setIsAuthenticated(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Atualizar dados do usuário quando token for renovado
          try {
            const profile = await getUserProfile(session.user.id);
            if (profile) {
              setUser({
                id: session.user.id,
                email: session.user.email,
                ...profile
              });
            }
          } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await logUserAction('logout');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const refreshUser = async () => {
    try {
      if (user?.id) {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setUser({
            id: user.id,
            email: user.email,
            ...profile
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    logout,
    refreshUser,
    profile: user, // Mantido para compatibilidade
    
    // Funções auxiliares
    setUser,
    setIsAuthenticated
  };

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
