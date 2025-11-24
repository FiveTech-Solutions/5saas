import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { getUserSessionData, logout as logoutService } from '../services/userService';

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
    } catch (error) {
      console.error("Failed to fetch user session data:", error);
      setSession(null); // Clear session on error
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        await fetchAndSetSession(currentSession.user);
      }
      setLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setLoading(true);
        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchAndSetSession(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
        }
        // TOKEN_REFRESHED events don't require a full session refetch unless necessary
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setSession(null);
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