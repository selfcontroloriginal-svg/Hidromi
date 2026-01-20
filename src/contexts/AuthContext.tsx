import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  role: 'admin' | 'vendor';
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ user?: User; error?: { message: string } }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users for fallback - using proper UUID format
const DEFAULT_USERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'hidromineralbrasil@gmail.com',
    password: 'Agua1050',
    profile: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      role: 'admin' as const,
      full_name: 'HidroMineral Admin'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'vendor@example.com',
    password: 'vendor123',
    profile: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      role: 'vendor' as const,
      full_name: 'Vendor User'
    }
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [profile, setProfile] = useState<Profile | null>(() => {
    const savedProfile = localStorage.getItem('profile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  // Helper function to ensure default user profile exists in Supabase
  const ensureDefaultUserProfile = async (defaultUser: typeof DEFAULT_USERS[0]) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', defaultUser.id)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error } = await supabase
          .from('profiles')
          .insert([{
            id: defaultUser.id,
            role: defaultUser.profile.role,
            full_name: defaultUser.profile.full_name
          }]);

        if (error) {
          console.log('Profile creation skipped (might already exist):', error.message);
        }
      }
    } catch (error) {
      console.log('Profile check/creation skipped:', error);
    }
  };
  // Sync with Supabase auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // If there's a Supabase session, get the profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          const userData = { id: session.user.id, email: session.user.email || '' };
          setUser(userData);
          setProfile(profileData);
        }
      } else {
        // If no Supabase session, check if we have a default user
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const defaultUser = DEFAULT_USERS.find(u => u.id === parsedUser.id);
          
          if (!defaultUser) {
            // Not a default user and no Supabase session, clear local state
            setUser(null);
            setProfile(null);
            localStorage.removeItem('user');
            localStorage.removeItem('profile');
          } else {
            // Ensure default user profile exists in Supabase
            await ensureDefaultUserProfile(defaultUser);
          }
        }
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          // Check if current user is a default user
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
          const isDefaultUser = currentUser && DEFAULT_USERS.some(u => u.id === currentUser.id);
          
          if (!isDefaultUser) {
            // Only clear state if not a default user
            setUser(null);
            setProfile(null);
            localStorage.removeItem('user');
            localStorage.removeItem('profile');
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            const userData = { id: session.user.id, email: session.user.email || '' };
            setUser(userData);
            setProfile(profileData);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      localStorage.setItem('profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('profile');
    }
  }, [profile]);

  const signIn = async (email: string, password: string) => {
    try {
      // First check if this is a default user
      const foundDefaultUser = DEFAULT_USERS.find(u => u.email === email && u.password === password);
      
      if (foundDefaultUser) {
        // Ensure default user profile exists in Supabase
        await ensureDefaultUserProfile(foundDefaultUser);
        
        const userData = { id: foundDefaultUser.id, email: foundDefaultUser.email };
        setUser(userData);
        setProfile(foundDefaultUser.profile);
        return { user: userData };
      }

      // Try Supabase authentication for real users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.user && !error) {
        // Get user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileData && !profileError) {
          const userData = { id: data.user.id, email: data.user.email || '' };
          setUser(userData);
          setProfile(profileData);
          return { user: userData };
        } else {
          // If profile doesn't exist, sign out from Supabase and return error
          await supabase.auth.signOut();
          return { error: { message: 'Perfil de usuário não encontrado. Verifique se o vendedor foi cadastrado corretamente.' } };
        }
      }

      // If Supabase authentication failed, return appropriate error
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Email ou senha incorretos. Verifique suas credenciais.' } };
        }
        return { error: { message: error.message } };
      }

      return { error: { message: 'Credenciais inválidas. Verifique email e senha.' } };

    } catch (error) {
      console.error('Authentication error:', error);
      return { error: { message: 'Erro de conexão. Tente novamente.' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    setUser(null);
    setProfile(null);
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
  };

  const value = {
    user,
    profile,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}