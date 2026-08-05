import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { usePresenceHeartbeat } from "@/lib/usePresenceHeartbeat";

export type Profile = {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  avatar_url: string | null;
  interests: string[];
  bio: string | null;
};

type Ctx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  usePresenceHeartbeat(user?.id);

  // A freshly-signed-up user's profile row is inserted right after the auth state
  // change fires, so a single read can legitimately come back empty. Retry briefly
  // instead of leaving the app stuck on "profile not set up yet".
  const loadProfile = async (uid: string, retries = 6) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
        if (error) {
          console.error("[auth] loadProfile error", error);
        } else if (data) {
          setProfile(data as Profile);
          return;
        }
      } catch (err) {
        console.error("[auth] loadProfile unexpected error", err);
      }
      if (attempt < retries) await new Promise((r) => setTimeout(r, 500));
    }
    setProfile(null);
  };


  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    }).catch((err) => {
      console.error("[auth] getSession error", err);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: Ctx = {
    user,
    session,
    profile,
    loading,
    refreshProfile: async () => {
      try {
        // `user` state can still be null right after sign-up, so fall back to the
        // live session rather than silently doing nothing.
        const uid = user?.id ?? (await supabase.auth.getUser()).data.user?.id;
        if (uid) await loadProfile(uid, 4);
      } catch (err) {
        console.error("[auth] refreshProfile error", err);
      }
    },
    signOut: async () => { await supabase.auth.signOut(); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

