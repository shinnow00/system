"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Task, TaskPart } from "@/types/database";
import { Loader2 } from "lucide-react";
import TaskCheckbox from "../TaskCheckbox";

interface DesignViewProps {
    userRole?: "Designer" | "Visual Manager" | "Social Media Manager" | "Account Manager" | "Admin";
    filter?: string;
    currentUserId?: string;
}

export default function DesignView({
    userRole = "Designer",
    filter = "my-tasks",
    currentUserId
}: DesignViewProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasks from Supabase
    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            const supabase = createClient();

            let query = supabase
                .from("tasks")
                .select(`
                    *,
                    task_parts (*),
                    creator:created_by ( full_name )
                `)
                .eq("department", "Designers");

            // Apply filters based on the active channel
            if (filter === "my-tasks" && currentUserId) {
                // query = query.eq("assigned_to", currentUserId); // COLUMN MISSING IN DB
                console.warn("DEBUG: 'my-tasks' filter requested but 'assigned_to' column is missing in DB.");
                query = query.neq("status", "Done");
            } else if (filter === "completed") {
                query = query.eq("status", "Done");
            }

            const { data: tasksWithParts, error: tasksError } = await query.order("created_at", { ascending: false });

            if (tasksError) {
                console.error("Error fetching tasks:", tasksError);
                setError("Failed to load tasks");
                setLoading(false);
                return;
            }

            setTasks(tasksWithParts || []);
            setLoading(false);
        };

        fetchTasks();
    }, [filter, currentUserId]);

    // Local update handler to keep UI in sync
    const handleLocalPartUpdate = (taskId: string, updatedPart: TaskPart) => {
        setTasks((prevTasks) =>
            prevTasks.map((t) => {
                if (t.id !== taskId) return t;
                return {
                    ...t,
                    task_parts: t.task_parts?.map((p) => {
                        if (p.id !== updatedPart.id) return p;
                        return updatedPart;
                    }),
                };
            })
        );
    };

    // Status badge colors
    const statusColors: Record<string, string> = {
        Todo: "bg-discord-text-muted/20 text-discord-text-muted",
        "In Progress": "bg-discord-blurple/20 text-discord-blurple",
        Done: "bg-discord-green/20 text-discord-green",
    };

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

    if (tasks.length === 0) {
        return (
            <div className="max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-discord-text mb-2">
                        Designer Task Board
                    </h1>
                    <p className="text-discord-text-muted">
                        No tasks found. Create some tasks to get started.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-discord-text mb-2">
                    Designer Task Board
                </h1>
                <p className="text-discord-text-muted">
                    Check off completed parts. Visual Managers can approve designer work.
                    <span className="ml-2 text-xs text-discord-blurple">Role: {userRole}</span>
                </p>
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="bg-discord-sidebar rounded-lg overflow-hidden border-l-4 border-discord-blurple"
                    >
                        {/* Card Header */}
                        <div className="px-4 py-3 border-b border-black/20">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="font-semibold text-discord-text truncate flex-1">
                                    {task.title}
                                </h3>
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusColors[task.status]}`}
                                >
                                    {task.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-3 space-y-2">
                            {!task.task_parts || task.task_parts.length === 0 ? (
                                <p className="text-xs text-discord-text-muted italic px-2 py-1">No parts linked</p>
                            ) : (
                                task.task_parts?.map((part) => (
                                    <TaskCheckbox
                                        key={part.id}
                                        part={part}
                                        userRole={userRole}
                                        onUpdate={(updatedPart) => handleLocalPartUpdate(task.id, updatedPart)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-4 py-2 bg-discord-dark/30 border-t border-black/10">
                            <div className="flex items-center justify-between text-xs text-discord-text-muted">
                                <span>
                                    {task.task_parts?.filter((p) => p.manager_approved).length || 0} /{" "}
                                    {task.task_parts?.length || 0} approved
                                </span>
                            </div>
                            <div className="mt-1.5 h-1 bg-discord-dark rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-discord-green transition-all duration-300"
                                    style={{
                                        width: `${task.task_parts?.length
                                            ? (task.task_parts.filter((p) => p.manager_approved).length /
                                                task.task_parts.length) *
                                            100
                                            : 0
                                            }%`,
                                    }}
                                />
                            </div>

                            {/* Metadata Footer */}
                            <div className="mt-4 pt-2 border-t border-discord-item flex items-center justify-between">
                                <span className="text-xs text-discord-text-muted">
                                    Created by: <span className="text-discord-text">{task.creator?.full_name || "Unknown"}</span>
                                </span>
                                <span className="text-xs text-discord-text-muted">
                                    Due: <span className="text-discord-text">
                                        {task.deadline
                                            ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            : "No date"}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
