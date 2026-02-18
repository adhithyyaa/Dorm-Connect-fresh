import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "student" | "admin" | "primary_admin";

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  username: string | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, role: "student" | "admin") => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: AppRole }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndProfile = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role, approval_status")
      .eq("user_id", userId)
      .limit(1)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .limit(1)
      .single();

    setUsername(profile?.username ?? null);

    if (roleData) {
      if (roleData.approval_status === "approved") {
        setRole(roleData.role as AppRole);
      } else {
        setRole(null);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // defer to avoid deadlock
        setTimeout(() => fetchRoleAndProfile(session.user.id), 0);
      } else {
        setUser(null);
        setRole(null);
        setUsername(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchRoleAndProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, usernameVal: string, roleVal: "student" | "admin") => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: usernameVal } },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Signup failed" };

    // Assign role
    const approvalStatus = roleVal === "admin" ? "pending" : "approved";
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: data.user.id,
      role: roleVal,
      approval_status: approvalStatus,
    });
    if (roleError) return { error: roleError.message };

    if (roleVal === "admin") {
      await supabase.auth.signOut();
      return { error: null };
    }

    setRole("student");
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Check role and approval
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role, approval_status")
      .eq("user_id", data.user.id)
      .limit(1)
      .single();

    if (!roleData) {
      await supabase.auth.signOut();
      return { error: "No role assigned." };
    }

    if (roleData.role !== "student" && roleData.approval_status !== "approved") {
      await supabase.auth.signOut();
      return { error: "Admin Approval Pending. Please wait for Primary Admin to approve your account." };
    }

    setRole(roleData.role as AppRole);
    return { error: null, role: roleData.role as AppRole };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, username, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
