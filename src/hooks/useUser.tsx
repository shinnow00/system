"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: Profile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const fetchUser = async () => {
            try {
                // Get current auth user
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    // Check for invalid refresh token error
                    if (authError.message.includes("Invalid Refresh Token") ||
                        authError.message.includes("Refresh Token Not Found")) {
                        await supabase.auth.signOut();
                        setUser(null);
                        setLoading(false);
                        router.push('/login');
                        return;
                    }
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (!authUser) {
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
                        role: null,
                        department: null,
                        avatar_url: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                } else {
                    setUser(profile);
                }
                setLoading(false);
            } catch (error) {
                console.error("Auth error:", error);
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                router.push('/login');
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session) {
                    fetchUser();
                }
            }
        });

        // Initial fetch
        fetchUser();

        return () => subscription.unsubscribe();
    }, [router]);

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
