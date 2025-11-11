import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = () => {
    supabase.auth.signOut();
    // No need to manually set states to null, onAuthStateChange will handle it
  };

  useEffect(() => {
    // Initial session and profile fetch
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    // Listener for Supabase auth events (SIGNED_IN, SIGNED_OUT)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    // Listener for our custom session expired event from Axios interceptor
    const handleSessionExpired = () => {
      console.log('Handling session-expired event. Signing out.');
      handleSignOut();
    };
    window.addEventListener('session-expired', handleSessionExpired);

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    signOut: handleSignOut, // Expose the sign out function
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
