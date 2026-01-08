"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Task } from "@/types/database";
import { Loader2 } from "lucide-react";
import AccountCard from "@/components/AccountCard";
import EditAccountDialog from "@/components/EditAccountDialog";

export default function AccountsView() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
            .from("tasks")
            .select("*")
            .eq("department", "Account Managers")
            .order("created_at", { ascending: false });

        if (fetchError) {
            console.error("Error fetching accounts:", fetchError);
            setError("Failed to load accounts");
            setLoading(false);
            return;
        }

        setTasks(data || []);
        setLoading(false);
    };

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setEditDialogOpen(true);
    };

    // Calculate stats
    const totalValue = tasks.reduce((sum, t) => {
        const meta = t.meta_data as Record<string, any> | null;
        // Parse budget if it is string, often budgets are strings like "5000" or "$5000"
        let val = 0;
        if (meta?.budget) {
            val = parseFloat(String(meta.budget).replace(/[^0-9.]/g, '')) || 0;
        }
        return sum + val;
    }, 0);

    // Group tasks if needed, or just list them. 
    // Usually Accounts like to see "Active" vs "Done".
    const activeTasks = tasks.filter(t => (t.meta_data as any)?.account_status !== 'Done');
    const closedTasks = tasks.filter(t => (t.meta_data as any)?.account_status === 'Done');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-discord-blurple" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-discord-text mb-2">Account Management</h1>
                <p className="text-discord-text-muted">Track client relationships and manage deal flow.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-discord-sidebar rounded-lg p-4 border border-discord-dark">
                    <p className="text-discord-text-muted text-sm mb-1 uppercase font-bold">Total Accounts</p>
                    <p className="text-2xl font-bold text-discord-text">{tasks.length}</p>
                </div>
                <div className="bg-discord-sidebar rounded-lg p-4 border border-discord-dark">
                    <p className="text-discord-text-muted text-sm mb-1 uppercase font-bold">Pipeline Budget</p>
                    <p className="text-2xl font-bold text-discord-blurple">{totalValue.toLocaleString()} EGP</p>
                </div>
                <div className="bg-discord-sidebar rounded-lg p-4 border border-discord-dark">
                    <p className="text-discord-text-muted text-sm mb-1 uppercase font-bold">Active Deals</p>
                    <p className="text-2xl font-bold text-discord-green">
                        {activeTasks.length}
                    </p>
                </div>
            </div>

            {/* Active Tasks Grid */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-discord-text mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Active Accounts
                </h2>

                {activeTasks.length === 0 ? (
                    <div className="bg-discord-sidebar rounded-lg p-8 text-center border-dashed border-2 border-discord-dark">
                        <p className="text-discord-text-muted">No active accounts.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeTasks.map((task) => (
                            <AccountCard
                                key={task.id}
                                task={task}
                                onUpdate={fetchTasks}
                                onEdit={handleEditTask}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Closed Tasks Grid */}
            {closedTasks.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-discord-text mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-discord-text-muted" />
                        Closed / Done
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                        {closedTasks.map((task) => (
                            <AccountCard
                                key={task.id}
                                task={task}
                                onUpdate={fetchTasks}
                                onEdit={handleEditTask}
                            />
                        ))}
                    </div>
                </div>
            )}

            <EditAccountDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                task={selectedTask}
                onTaskUpdated={fetchTasks}
            />
        </div>
    );
}

