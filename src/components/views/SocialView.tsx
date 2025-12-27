"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Task } from "@/types/database";
import { Instagram, Linkedin, ExternalLink, Loader2, Video, Image, LayoutGrid, CheckCircle2, Clock } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import TaskCheckbox from "@/components/TaskCheckbox";

// Platform configuration with colors and icons
const platformConfig: Record<string, { icon: typeof Instagram; color: string; bgColor: string }> = {
    Instagram: { icon: Instagram, color: "text-pink-400", bgColor: "border-l-pink-500" },
    TikTok: { icon: Video, color: "text-cyan-400", bgColor: "border-l-cyan-400" },
    LinkedIn: { icon: Linkedin, color: "text-blue-500", bgColor: "border-l-blue-500" },
};

// Content type icons
const contentTypeIcons: Record<string, typeof Video> = {
    Video: Video,
    Image: Image,
    Carousel: LayoutGrid,
};

// Status colors
const statusColors: Record<string, string> = {
    Todo: "bg-discord-text-muted/20 text-discord-text-muted",
    "In Progress": "bg-discord-blurple/20 text-discord-blurple",
    Done: "bg-discord-green/20 text-discord-green",
};

export default function SocialView() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useUser();

    useEffect(() => {
        const fetchTasks = async () => {
            if (!user) return;

            const supabase = createClient();

            // Broad fetch for debugging and proven logic
            const { data: allTasks, error: fetchError } = await supabase
                .from("tasks")
                .select("*, task_parts(*), creator:created_by(full_name), assignee:assigned_to(full_name)")
                .order("created_at", { ascending: false });

            if (fetchError) {
                console.error("Error fetching tasks:", fetchError);
                setError("Failed to load content");
                setLoading(false);
                return;
            }

            // Filter locally to guarantee logic
            const filteredTasks = (allTasks || []).filter(task => {
                // 1. Always show Internal Social Tasks
                if (task.department === 'Social Media') return true;

                // 2. Show Designer Tasks ONLY if they originated from Social Request
                if (task.department === 'Designers') {
                    const meta = (task.meta_data as any) || {};
                    return meta.origin === 'social_request';
                }

                return false;
            });

            console.log("Social Tasks:", filteredTasks);
            setTasks(filteredTasks);
            setLoading(false);
        };

        if (user) fetchTasks();
    }, [user]);

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
                    <h1 className="text-2xl font-bold text-discord-text mb-2">Content Board</h1>
                    <p className="text-discord-text-muted">No content tasks found. Create some to get started.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-discord-text mb-2">Content Board</h1>
                <p className="text-discord-text-muted">Manage social media content across platforms.</p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task) => {
                    const meta = (task.meta_data as Record<string, string>) || {};
                    const platform = meta.platform || "Instagram";
                    const tov = meta.tone_of_voice || null;
                    const contentType = meta.content_type || null;
                    const referenceLink = meta.reference_link || null;

                    const platformData = platformConfig[platform] || platformConfig.Instagram;
                    const PlatformIcon = platformData.icon;
                    const ContentTypeIcon = contentType ? contentTypeIcons[contentType] : null;

                    return (
                        <div
                            key={task.id}
                            className={`bg-discord-sidebar rounded-lg overflow-hidden border-l-4 ${platformData.bgColor}`}
                        >
                            {/* Card Header */}
                            <div className="px-4 py-3 border-b border-black/20">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    {/* Platform Icon */}
                                    <div className={`flex items-center gap-2 ${platformData.color}`}>
                                        <PlatformIcon size={20} />
                                        <span className="text-sm font-medium">{platform}</span>
                                    </div>
                                    {/* Status Badge */}
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status]}`}>
                                        {task.status}
                                    </span>
                                </div>
                                {/* Title */}
                                <h3 className="font-semibold text-discord-text truncate">{task.title}</h3>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-3">
                                {/* If it has task parts (Design Request or Internal with Checklist) */}
                                {task.task_parts && task.task_parts.length > 0 ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-discord-text-muted uppercase tracking-wider">
                                            <LayoutGrid size={12} />
                                            <span>Deliverables</span>
                                        </div>
                                        {task.task_parts.map((part) => (
                                            <TaskCheckbox
                                                key={part.id}
                                                part={part}
                                                onUpdate={(updatedPart) => {
                                                    setTasks(prev => prev.map(t => {
                                                        if (t.id !== task.id) return t;
                                                        return {
                                                            ...t,
                                                            task_parts: t.task_parts?.map(p => p.id === updatedPart.id ? updatedPart : p)
                                                        };
                                                    }));
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {/* Content Type */}
                                        {contentType && ContentTypeIcon && (
                                            <div className="flex items-center gap-2 text-sm text-discord-text-muted">
                                                <ContentTypeIcon size={16} />
                                                <span>{contentType}</span>
                                            </div>
                                        )}

                                        {/* TOV Badge */}
                                        {tov && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-discord-text-muted">TOV:</span>
                                                <span className="px-2 py-0.5 bg-discord-item rounded-full text-xs text-discord-text">
                                                    {tov}
                                                </span>
                                            </div>
                                        )}

                                        {/* Reference Link */}
                                        {referenceLink && (
                                            <a
                                                href={referenceLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-discord-blurple hover:underline"
                                            >
                                                <ExternalLink size={14} />
                                                <span>View Reference</span>
                                            </a>
                                        )}
                                    </>
                                )}

                                {/* Deadline & Info */}
                                <div className="pt-2 border-t border-white/5 space-y-1">
                                    {task.deadline && (
                                        <div className="flex items-center gap-1.5 text-xs text-discord-text-muted">
                                            <span className="font-semibold text-[10px] uppercase">Due:</span>
                                            <span>{new Date(task.deadline).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {task.department === "Designers" ? (
                                        <div className="flex items-center gap-2 text-[10px] text-discord-blurple font-bold uppercase border-l-2 border-discord-blurple pl-2 py-0.5">
                                            <Clock size={10} />
                                            <span>Sent to: {task.assignee?.full_name || "Designer"}</span>
                                        </div>
                                    ) : task.assignee && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-discord-text-muted">
                                            <span className="uppercase font-semibold text-[8px]">Assigned to:</span>
                                            <span className="text-discord-text font-medium">{task.assignee.full_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 py-2 bg-discord-dark/30 border-t border-black/10">
                                <div className="flex items-center justify-between text-xs text-discord-text-muted">
                                    <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
