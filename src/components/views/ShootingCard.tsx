"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Task, Profile } from "@/types/database";
import {
    Video,
    Calendar,
    ExternalLink,
    Loader2,
    CheckCircle2,
    Clock,
    Send,
    UserCircle
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ShootingCardProps {
    task: Task;
    onUpdate: () => void;
}

const statusOptions = [
    "Started",
    "Pending Script",
    "Shooting Stage",
    "Post Production",
    "Done"
];

export default function ShootingCard({ task, onUpdate }: ShootingCardProps) {
    const [updating, setUpdating] = useState(false);
    const [designers, setDesigners] = useState<Profile[]>([]);
    const [selectedDesigner, setSelectedDesigner] = useState<string>("");
    const [linkedTaskStatus, setLinkedTaskStatus] = useState<string | null>(null);
    const [loadingLinkedStatus, setLoadingLinkedStatus] = useState(false);

    const meta = (task.meta_data as any) || {};
    const shootingStatus = meta.shooting_status || "Started";
    const requireDesigner = meta.require_designer === true;
    const linkedTaskId = meta.linked_design_task_id;

    // Fetch designers for the dropdown
    useEffect(() => {
        const fetchDesigners = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("department", "Designers")
                .order("full_name", { ascending: true });
            if (data) setDesigners(data);
        };

        if (shootingStatus === "Post Production" && requireDesigner && !linkedTaskId) {
            fetchDesigners();
        }
    }, [shootingStatus, requireDesigner, linkedTaskId]);

    // Fetch linked task status
    useEffect(() => {
        const fetchLinkedStatus = async () => {
            if (!linkedTaskId) return;
            setLoadingLinkedStatus(true);
            const supabase = createClient();
            const { data } = await supabase
                .from("tasks")
                .select("status")
                .eq("id", linkedTaskId)
                .single();
            if (data) setLinkedTaskStatus(data.status);
            setLoadingLinkedStatus(false);
        };

        if (linkedTaskId) fetchLinkedStatus();
    }, [linkedTaskId]);

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true);
        const supabase = createClient();

        const newMetaData = {
            ...meta,
            shooting_status: newStatus
        };

        const { error } = await supabase
            .from("tasks")
            .update({ meta_data: newMetaData })
            .eq("id", task.id);

        if (!error) onUpdate();
        setUpdating(false);
    };

    const handleSendToDesigner = async () => {
        if (!selectedDesigner) return;
        setUpdating(true);
        const supabase = createClient();

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // 2. Create new Designer Task
            const { data: designTask, error: taskError } = await supabase
                .from("tasks")
                .insert({
                    title: `Shooting Post-Prod: ${meta.client_name || "Unknown"}`,
                    department: "Designers",
                    status: "Todo",
                    deadline: task.deadline,
                    created_by: user.id,
                    assigned_to: selectedDesigner,
                    meta_data: {
                        origin: 'social_request',
                        source_task_id: task.id
                    }
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // 3. Add task part
            const { error: partError } = await supabase
                .from("task_parts")
                .insert({
                    task_id: designTask.id,
                    title: "Post Production",
                    designer_checked: false,
                    manager_approved: false
                });

            if (partError) throw partError;

            // 4. Update original Shooting Task
            const newMetaData = {
                ...meta,
                linked_design_task_id: designTask.id
            };

            const { error: updateError } = await supabase
                .from("tasks")
                .update({ meta_data: newMetaData })
                .eq("id", task.id);

            if (updateError) throw updateError;

            onUpdate();
        } catch (err) {
            console.error("Error sending to designer:", err);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="bg-discord-sidebar rounded-lg p-5 border border-white/5 hover:border-discord-blurple/50 transition-colors flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                    <Video size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Select value={shootingStatus} onValueChange={handleStatusChange} disabled={updating}>
                        <SelectTrigger className="w-[140px] h-8 text-[10px] font-bold uppercase bg-discord-dark border-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-discord-sidebar border-discord-dark">
                            {statusOptions.map(opt => (
                                <SelectItem key={opt} value={opt} className="text-xs uppercase font-bold">
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-discord-text mb-1 truncate">
                {meta.client_name || "Untitled Shoot"}
            </h3>

            <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-discord-text-muted">
                    <Calendar size={16} />
                    <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Deadline"}</span>
                </div>

                {meta.script_link && (
                    <a
                        href={meta.script_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-discord-blurple hover:underline"
                    >
                        <ExternalLink size={16} />
                        <span className="truncate">View Script</span>
                    </a>
                )}

                {/* Post Production Section */}
                {shootingStatus === "Post Production" && requireDesigner && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-discord-blurple uppercase tracking-wider">
                            <Clock size={14} />
                            <span>Post Production</span>
                        </div>

                        {linkedTaskId ? (
                            <div className="bg-discord-dark/50 p-3 rounded-lg border border-white/5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <UserCircle size={16} className="text-discord-text-muted flex-shrink-0" />
                                        <p className="text-[11px] text-discord-text truncate">Linked Design Task</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${linkedTaskStatus === "Done" ? "bg-discord-green/20 text-discord-green" : "bg-discord-item text-discord-text-muted"
                                        }`}>
                                        {loadingLinkedStatus ? "..." : linkedTaskStatus || "Unknown"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Select value={selectedDesigner} onValueChange={setSelectedDesigner} disabled={updating}>
                                    <SelectTrigger className="w-full h-9 text-xs bg-discord-dark border-none text-discord-text">
                                        <SelectValue placeholder="Select Designer" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-discord-sidebar border-discord-dark">
                                        {designers.map(d => (
                                            <SelectItem key={d.id} value={d.id} className="text-xs">
                                                {d.full_name || d.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleSendToDesigner}
                                    className="w-full h-9 bg-discord-blurple hover:bg-discord-blurple-hover text-white text-xs font-bold"
                                    disabled={!selectedDesigner || updating}
                                >
                                    {updating ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} className="mr-2" /> SEND TO DESIGNER</>}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-discord-text-muted uppercase font-bold">
                <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                {requireDesigner && (
                    <span className="flex items-center gap-1 text-discord-blurple/80">
                        <CheckCircle2 size={12} /> Designer Required
                    </span>
                )}
            </div>
        </div>
    );
}
