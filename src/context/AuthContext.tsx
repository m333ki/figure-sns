"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  username: string | null;
  loading: boolean;
  authModalOpen: boolean;
  promptLogin: () => void;
  closeAuthModal: () => void;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function usernameFromUser(user: User | null): string | null {
  if (!user) return null;
  const metaName = user.user_metadata?.username;
  if (typeof metaName === "string" && metaName.trim().length > 0) return metaName;
  return user.email?.split("@")[0] ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Bootstrap: read whatever session is already persisted locally, then
    // subscribe for future changes (sign in/out, token refresh).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const promptLogin = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setAuthModalOpen(false);
      }
      return { needsEmailConfirmation: !data.session };
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    setAuthModalOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const user = session?.user ?? null;

  // Without this, a plain object literal here would be a new reference on
  // every render -- including ones triggered by unrelated state like
  // authModalOpen -- forcing every useAuth() consumer in the app to
  // re-render too.
  const value = useMemo(
    () => ({
      session,
      user,
      username: usernameFromUser(user),
      loading,
      authModalOpen,
      promptLogin,
      closeAuthModal,
      signUp,
      signIn,
      signOut,
    }),
    [session, user, loading, authModalOpen, promptLogin, closeAuthModal, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
