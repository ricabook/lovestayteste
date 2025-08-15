import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityLogging } from './useSecurityLogging';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { logSecurityEvent } = useSecurityLogging();

  useEffect(() => {
    let isInitialized = false;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (isInitialized) {
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      isInitialized = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Log security event
    if (error) {
      await logSecurityEvent('login_failed', { email, error: error.message });
    } else {
      await logSecurityEvent('login_success', { email });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, userType: string = 'user', whatsappNumber: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          user_type: userType,
          whatsapp_number: whatsappNumber,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Força a limpeza do estado local primeiro
      setSession(null);
      setUser(null);
      
      // Limpa o localStorage
      localStorage.removeItem('sb-nqelqekpvhzteaqehuwg-auth-token');
      
      // Tenta fazer logout no servidor (pode falhar se sessão já expirou)
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      // Força refresh da página para limpar qualquer cache restante
      window.location.reload();
      
      return { error };
    } catch (error) {
      // Se qualquer erro ocorrer, ainda limpa o estado local e recarrega
      setSession(null);
      setUser(null);
      localStorage.clear();
      window.location.reload();
      return { error: null };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}