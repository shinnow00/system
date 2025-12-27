"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { Task, TaskPart } from "@/types/database";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import TaskCheckbox from "../TaskCheckbox";
import TaskCard from "../TaskCard";

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
    const [groupingMode, setGroupingMode] = useState<'month' | 'designer' | 'creator'>('month');

    // Helper to group tasks
    const groupTasks = (tasks: Task[], mode: string) => {
        const groups: Record<string, Task[]> = {};

        tasks.forEach((task) => {
            let groupKey = "Other";

            if (mode === 'month') {
                groupKey = task.deadline
                    ? format(new Date(task.deadline), "MMMM yyyy")
                    : "📅 No Deadline";
            } else if (mode === 'designer') {
                groupKey = task.assignee?.full_name ? `👤 ${task.assignee.full_name}` : "👤 Unassigned";
            } else if (mode === 'creator') {
                groupKey = task.creator?.full_name ? `✍️ ${task.creator.full_name}` : "✍️ Unknown";
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(task);
        });

        return groups;
    };

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
                    creator:created_by ( full_name ),
                    assignee:assigned_to ( full_name )
                `)
                .eq("department", "Designers");

            // Apply filters based on the active channel
            if (filter === "my-tasks" && currentUserId) {
                query = query.eq("assigned_to", currentUserId).neq("status", "Done");
            } else if (filter === "completed" && currentUserId) {
                query = query.eq("assigned_to", currentUserId).eq("status", "Done");
            }
            // team-board doesn't need extra filters beyond department

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
        setTasks((prevTasks: Task[]) =>
            prevTasks.map((t: Task) => {
                if (t.id !== taskId) return t;
                return {
                    ...t,
                    task_parts: t.task_parts?.map((p: TaskPart) => {
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

    const currentGroupingMode = filter === "my-tasks" ? "month" : groupingMode;
    const groupedTasks = groupTasks(tasks, currentGroupingMode);

    return (
        <div className="max-w-6xl">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-discord-text mb-2">
                        Designer Task Board
                    </h1>
                    <p className="text-discord-text-muted">
                        Check off completed parts. Visual Managers can approve designer work.
                        <span className="ml-2 text-xs text-discord-blurple">Role: {userRole}</span>
                    </p>
                </div>

                {filter === "team-board" && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-discord-text-muted uppercase tracking-wide">
                            Group By:
                        </span>
                        <Select
                            value={groupingMode}
                            onValueChange={(val: any) => setGroupingMode(val)}
                        >
                            <SelectTrigger className="w-[180px] bg-discord-sidebar border-discord-dark text-discord-text text-sm h-9">
                                <SelectValue placeholder="Group by..." />
                            </SelectTrigger>
                            <SelectContent className="bg-discord-sidebar border-discord-dark">
                                <SelectItem value="month" className="text-discord-text focus:bg-discord-item">
                                    Month (Deadline)
                                </SelectItem>
                                <SelectItem value="designer" className="text-discord-text focus:bg-discord-item">
                                    Designer (Assignee)
                                </SelectItem>
                                <SelectItem value="creator" className="text-discord-text focus:bg-discord-item">
                                    Creator
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Grouped Tasks */}
            <div className="space-y-12">
                {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                    <div key={groupName}>
                        <h2 className="text-xl font-bold text-discord-text mb-4 mt-8 flex items-center gap-2">
                            {groupName}
                            <span className="text-xs font-normal text-discord-text-muted bg-discord-dark px-2 py-0.5 rounded-full">
                                {groupTasks.length}
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {groupTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onTaskUpdate={(updatedTask: Task) => {
                                        setTasks((prev: Task[]) => prev.map((t: Task) => t.id === updatedTask.id ? updatedTask : t));
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
