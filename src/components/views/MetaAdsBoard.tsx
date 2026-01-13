"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Task } from "@/types/database";
import { Loader2, RefreshCw } from "lucide-react";
import MetaAdsCard from "./MetaAdsCard";

export default function MetaAdsBoard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetaAdsTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error: fetchError } = await supabase
                .from("tasks")
                .select("*")
                .eq("department", "Social Media")
                .filter("meta_data->>type", "eq", "meta-ads")
                .order("created_at", { ascending: false });

            if (fetchError) throw fetchError;
            setTasks(data || []);
        } catch (err: any) {
            console.error("Error fetching Meta Ads tasks:", err);
            setError(err.message || "Failed to fetch Meta Ads tasks");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetaAdsTasks();
    }, [fetchMetaAdsTasks]);

    return (
        <div className="max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-discord-text mb-2">Meta Ads Board</h1>
                    <p className="text-discord-text-muted">Monitor and track Meta Ads campaign progress.</p>
                </div>
                <button
                    onClick={fetchMetaAdsTasks}
                    className="p-2 text-discord-text-muted hover:text-discord-text transition-colors bg-discord-sidebar hover:bg-discord-item rounded-lg border border-white/5"
                    title="Refresh Board"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
                    {error}
                </div>
            )}

            {loading && tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-discord-text-muted">
                    <Loader2 size={40} className="animate-spin mb-4 opacity-20 text-discord-blurple" />
                    <p className="font-medium">Loading ad campaigns...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-discord-sidebar rounded-xl p-12 border border-white/5 text-center shadow-inner">
                    <p className="text-discord-text-muted mb-4 font-medium italic">No Meta Ads tasks found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task) => (
                        <MetaAdsCard
                            key={task.id}
                            task={task}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
