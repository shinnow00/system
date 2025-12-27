"use client";

import { useState } from "react";
import TaskCheckbox from "./TaskCheckbox";
import { Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

import { Task, TaskPart } from "@/types/database";

// User Role - Removed mock data

interface TaskCardProps {
    task: Task;
    onTaskUpdate?: (updatedTask: Task) => void;
}

export default function TaskCard({ task, onTaskUpdate }: TaskCardProps) {
    const [taskData, setTaskData] = useState<Task>(task);
    const router = useRouter();

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this task? All associated checklist parts will also be removed.")) {
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.from('tasks').delete().eq('id', task.id);

        if (error) {
            console.error("Error deleting task:", error.message);
            alert("Failed to delete task: " + error.message);
        } else {
            router.refresh();
        }
    };

    // Local update handler
    const handleLocalPartUpdate = (updatedPart: TaskPart) => {
        setTaskData((prevTask: Task) => {
            const updatedParts = (prevTask.task_parts || []).map((part: TaskPart) => {
                if (part.id !== updatedPart.id) return part;
                return updatedPart;
            });

            const updatedTask = { ...prevTask, task_parts: updatedParts };
            onTaskUpdate?.(updatedTask);
            return updatedTask;
        });
    };

    // Status badge colors
    const statusColors: Record<string, string> = {
        Todo: "bg-discord-text-muted/20 text-discord-text-muted",
        "In Progress": "bg-discord-blurple/20 text-discord-blurple",
        Done: "bg-discord-green/20 text-discord-green",
    };

    return (
        <div className="bg-discord-sidebar rounded-lg overflow-hidden border-l-4 border-discord-blurple">
            {/* Card Header - Like Discord Embed */}
            <div className="px-4 py-3 border-b border-black/20">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-discord-text truncate flex-1">
                        {taskData.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleDelete}
                            className="p-1 text-discord-text-muted hover:text-red-400 transition-colors"
                            title="Delete Task"
                        >
                            <Trash2 size={16} />
                        </button>
                        <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[taskData.status]}`}
                        >
                            {taskData.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3 space-y-2">
                {!taskData.task_parts || taskData.task_parts.length === 0 ? (
                    <p className="text-xs text-discord-text-muted italic px-2 py-1">No parts linked</p>
                ) : (
                    taskData.task_parts?.map((part) => (
                        <TaskCheckbox
                            key={part.id}
                            part={part}
                            onUpdate={handleLocalPartUpdate}
                        />
                    ))
                )}
            </div>

            {/* Card Footer - Progress */}
            <div className="px-4 py-2 bg-discord-dark/30 border-t border-black/10">
                <div className="flex items-center justify-between text-xs text-discord-text-muted">
                    <span>
                        {taskData.task_parts?.filter((p: TaskPart) => p.manager_approved).length || 0} /{" "}
                        {taskData.task_parts?.length || 0} approved
                    </span>
                    <span className="text-discord-text-muted/70">
                        {/* Role displayed via real context inside Checkbox */}
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-1.5 h-1 bg-discord-dark rounded-full overflow-hidden">
                    <div
                        className="h-full bg-discord-green transition-all duration-300"
                        style={{
                            width: `${(taskData.task_parts?.length ? (taskData.task_parts.filter((p: TaskPart) => p.manager_approved).length / taskData.task_parts.length) * 100 : 0)}%`,
                        }}
                    />
                </div>

                {/* Metadata Footer */}
                <div className="mt-4 pt-2 border-t border-discord-item space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-discord-text-muted">
                            Created by: <span className="text-discord-text">{taskData.creator?.full_name || "Unknown"}</span>
                        </span>
                        <span className="text-xs text-discord-text-muted">
                            Assigned to: <span className="text-discord-text">{taskData.assignee?.full_name || "Unassigned"}</span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-discord-text-muted">
                            Due: <span className="text-discord-text">
                                {taskData.deadline
                                    ? new Date(taskData.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : "No date"}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
