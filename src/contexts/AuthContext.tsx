
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Setting up auth state change listener...");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state change event:", event, "Session exists:", !!newSession);
        
        // Important: Update both session and user state
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          setAuthError(null);
          toast({
            title: "Welcome!",
            description: "You have successfully signed in.",
          });
          
          // Use setTimeout to prevent auth deadlocks when executing additional code
          setTimeout(() => {
            console.log("Signed in user:", newSession?.user?.email);
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("User signed out successfully");
          toast({
            title: "Signed out",
            description: "You have been signed out.",
          });
        }
      }
    );

    // Set initial loading state
    setIsLoading(true);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        setAuthError(error.message);
      } else {
        console.log("Initial session check:", !!currentSession);
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    console.log("Starting Google sign in process...");
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Clean up existing auth state to prevent conflicts
      cleanupAuthState();
      
      // Try to sign out globally first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Performed pre-signin global signout");
      } catch (signOutError) {
        console.log("Pre-signin signout not critical:", signOutError);
        // Continue with sign-in even if this fails
      }
      
      // Check if we can reach Google first for better error diagnostics
      try {
        console.log("Testing Google connectivity...");
        const testConnection = await fetch('https://accounts.google.com/favicon.ico', { 
          mode: 'no-cors',
          cache: 'no-cache' 
        });
        console.log("Google connectivity test passed");
      } catch (connError) {
        console.error("Cannot connect to Google:", connError);
        setAuthError("Could not connect to Google authentication service. Please check your internet connection.");
        setIsLoading(false);
        throw new Error("Could not connect to Google authentication service");
      }
      
      console.log("Initiating Google OAuth sign in...");
      
      // Perform the actual sign-in with additional debugging info
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      console.log("Google sign in response:", { 
        url: data?.url,
        provider: data?.provider,
        hasError: !!error 
      });
      
      if (error) {
        console.error("Error signing in with Google:", error);
        setAuthError(error.message);
        setIsLoading(false);
        throw error;
      }
      
      // Don't set isLoading to false as we're redirecting to Google
      console.log("Redirecting to Google authentication...");
      
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      setAuthError(error.message || "An unexpected error occurred");
      setIsLoading(false);
      throw error;
    }
    // Note: don't set isLoading to false here as we're redirecting to Google
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Error signing in with email:", error);
        setAuthError(error.message);
        throw error;
      }
    } catch (error) {
      console.error("Unexpected error during email sign in:", error);
      setAuthError(error.message || "An unexpected error occurred");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        console.error("Error signing up with email:", error);
        setAuthError(error.message);
        throw error;
      }
      
      toast({
        title: "Registration successful",
        description: "Please check your email for a confirmation link.",
      });
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      setAuthError(error.message || "An unexpected error occurred");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        console.error("Error resetting password:", error);
        setAuthError(error.message);
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email for a password reset link.",
      });
    } catch (error) {
      console.error("Unexpected error during password reset:", error);
      setAuthError(error.message || "An unexpected error occurred");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log("Starting sign out process...");
    setIsLoading(true);
    
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Then attempt global sign out for complete cleanup
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Error signing out:", error);
        setAuthError(error.message);
        
        // Even if there's an error, force a reload to reset state
        window.location.href = '/auth';
        throw error;
      }
      
      // On successful signout, force page reload for a clean state
      console.log("Sign out successful, redirecting to auth page...");
      window.location.href = '/auth';
      
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      setAuthError(error.message || "An unexpected error occurred");
      
      // Force reload even on error
      window.location.href = '/auth';
      throw error;
    }
    // No need to set isLoading to false as we're reloading the page
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      authError, 
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      signOut 
    }}>
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
