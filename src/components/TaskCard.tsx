"use client";

import { useState } from "react";
import TaskCheckbox from "./TaskCheckbox";

import { Task, TaskPart } from "@/types/database";

// User Role - Change this to test different behaviors
export const USER_ROLE: "Designer" | "Visual Manager" = "Visual Manager";

interface TaskCardProps {
    task: Task;
    onTaskUpdate?: (updatedTask: Task) => void;
}

export default function TaskCard({ task, onTaskUpdate }: TaskCardProps) {
    const [taskData, setTaskData] = useState<Task>(task);

    // Local update handler
    const handleLocalPartUpdate = (updatedPart: any) => {
        setTaskData((prevTask) => {
            const updatedParts = (prevTask.task_parts || []).map((part) => {
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
                    <span
                        className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusColors[taskData.status]}`}
                    >
                        {taskData.status}
                    </span>
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
                            userRole={USER_ROLE}
                            onUpdate={handleLocalPartUpdate}
                        />
                    ))
                )}
            </div>

            {/* Card Footer - Progress */}
            <div className="px-4 py-2 bg-discord-dark/30 border-t border-black/10">
                <div className="flex items-center justify-between text-xs text-discord-text-muted">
                    <span>
                        {taskData.task_parts?.filter((p) => p.manager_approved).length || 0} /{" "}
                        {taskData.task_parts?.length || 0} approved
                    </span>
                    <span className="text-discord-text-muted/70">
                        Role: {USER_ROLE}
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-1.5 h-1 bg-discord-dark rounded-full overflow-hidden">
                    <div
                        className="h-full bg-discord-green transition-all duration-300"
                        style={{
                            width: `${(taskData.task_parts?.length ? (taskData.task_parts.filter((p) => p.manager_approved).length / taskData.task_parts.length) * 100 : 0)}%`,
                        }}
                    />
                </div>

                {/* Metadata Footer */}
                <div className="mt-4 pt-2 border-t border-discord-item flex items-center justify-between">
                    <span className="text-xs text-discord-text-muted">
                        Created by: <span className="text-discord-text">{taskData.creator?.full_name || "Unknown"}</span>
                    </span>
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
    );
}
