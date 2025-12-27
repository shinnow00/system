"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database";

interface AuthContextType {
    user: Profile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();

            // Get current auth user
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !authUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            // Get profile data
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .single();

            if (profileError) {
                console.error("Error fetching user profile:", profileError);
                // Fallback profile if record doesn't exist yet but user is authed
                setUser({
                    id: authUser.id,
                    email: authUser.email || "",
                    full_name: null,
                    role: "Designer",
                    department: "Designers",
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            } else {
                setUser(profile);
            }

            setLoading(false);
        };

        fetchUser();

        // Optional: Set up auth listener if you want to react to logouts/logins in real-time
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setUser(null);
            } else {
                fetchUser();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useUser() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useUser must be used within an AuthProvider");
    }
    return context;
}
