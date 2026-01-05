"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut } from "lucide-react";

export default function UnassignedView() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-discord-bg flex items-center justify-center p-4">
            <div className="bg-discord-sidebar p-8 rounded-xl shadow-2xl border border-white/10 max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-discord-blurple/20 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert size={40} className="text-discord-blurple" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-discord-text">Access Pending</h1>
                    <p className="text-discord-text-muted">
                        Your account hasn't been assigned a role yet. Please contact the developer or your manager to assign a role to your account.
                    </p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-lg font-bold transition-colors"
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
