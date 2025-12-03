import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import logger from '../utils/logger';
import { supabase } from '../services/supabase';
import { getUserSessionData, logout as logoutService } from '../services/userService';
import { setUser as setSentryUser, clearUser as clearSentryUser } from '../utils/sentry';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // This state will hold the entire session object: { user, tenant, subscription }
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetSession = async (user) => {
    if (!user) {
      setSession(null);
      return;
    }
    try {
      const sessionData = await getUserSessionData(user.id);
      // Add the user's email from the auth object, as it's not in our public profile table
      if (sessionData) {
        sessionData.user.email = user.email;
      }
      setSession(sessionData);

      // Set user in Sentry for error tracking
      if (sessionData?.user) {
        setSentryUser(sessionData.user);
      }
    } catch (error) {
      logger.error("Failed to fetch user session data:", error);
      setSession(null); // Clear session on error
    }
  };

  useEffect(() => {
    let timeoutId;

    const initializeSession = async () => {
      setLoading(true);

      // Timeout de segurança: se demorar mais de 10s, força o fim do loading
      timeoutId = setTimeout(() => {
        logger.warn('Session initialization timeout - forcing loading to false');
        setLoading(false);
      }, 10000);

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          await fetchAndSetSession(currentSession.user);
        }
      } catch (error) {
        logger.error('Error initializing session:', error);
        setSession(null);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setLoading(true);

        // Timeout de segurança para mudanças de estado
        const authTimeoutId = setTimeout(() => {
          logger.warn('Auth state change timeout - forcing loading to false');
          setLoading(false);
        }, 10000);

        try {
          if (event === 'SIGNED_IN' && newSession?.user) {
            await fetchAndSetSession(newSession.user);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
          }
          // TOKEN_REFRESHED events don't require a full session refetch unless necessary
        } catch (error) {
          logger.error('Error in auth state change:', error);
        } finally {
          clearTimeout(authTimeoutId);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setSession(null);

    // Clear user from Sentry
    clearSentryUser();
  }, []);

  // useMemo helps to prevent re-renders of consumers when the value object has not changed.
  const value = useMemo(() => {
    const isAuthenticated = !!session?.user;

    return {
      // Raw session object
      session,
      // Granular, easy-to-access data
      user: session?.user || null,
      tenant: session?.tenant || null,
      subscription: session?.subscription || null,
      features: session?.subscription?.features || [],
      // Status flags
      isAuthenticated,
      isAdmin: session?.user?.role === 'admin',
      loading,
      // Functions
      logout,
    };
  }, [session, loading, logout]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: '#666', fontSize: '14px' }}>Carregando...</p>
        </div>
      ) : (
        children
      )}
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