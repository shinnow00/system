"use client";

import { Task, TaskPart } from "@/types/database";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Phone, Calendar, MessageSquare, DollarSign, MapPin, Edit2, Archive, Paintbrush, Plus, CheckSquare } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import CreateTaskDialog from "@/components/CreateTaskDialog";

interface AccountCardProps {
    task: Task;
    onUpdate: () => void;
    onEdit: (task: Task) => void;
}

export default function AccountCard({ task, onUpdate, onEdit }: AccountCardProps) {
    const meta = (task.meta_data as any) || {};
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Linked Task State
    const [linkedTask, setLinkedTask] = useState<Task | null>(null);
    const [linkedParts, setLinkedParts] = useState<TaskPart[]>([]);
    const [showCreateDesignDialog, setShowCreateDesignDialog] = useState(false);

    useEffect(() => {
        if (meta.linked_design_task_id) {
            fetchLinkedTask(meta.linked_design_task_id);
        }
    }, [meta.linked_design_task_id]);

    const fetchLinkedTask = async (linkedId: string) => {
        const supabase = createClient();

        // Fetch Task with Parts
        const { data: taskData, error } = await supabase
            .from("tasks")
            .select("*, task_parts(*)")
            .eq("id", linkedId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching linked task:", error);
            return;
        }

        if (!taskData) {
            setLinkedTask(null);
            setLinkedParts([]);
            return;
        }
        const { task_parts, ...cleanTask } = taskData as any;

        setLinkedTask(cleanTask);
        setLinkedParts((task_parts || []) as TaskPart[]);
    };

    const handleStatusChange = async (newStatus: string) => {
        setUpdatingStatus(true);
        const supabase = createClient();

        // Update meta_data with new account_status
        const updatedMeta = {
            ...meta,
            account_status: newStatus
        };

        const { error } = await supabase
            .from("tasks")
            .update({
                meta_data: updatedMeta,
            })
            .eq("id", task.id);

        if (error) {
            console.error("Error updating status:", error);
        } else {
            onUpdate();
        }
        setUpdatingStatus(false);
    };

    const handleDesignTaskCreated = async (newTask?: any) => {
        if (!newTask) return;

        const supabase = createClient();
        const updatedMeta = {
            ...meta,
            linked_design_task_id: newTask.id
        };

        await supabase
            .from("tasks")
            .update({ meta_data: updatedMeta })
            .eq("id", task.id);

        onUpdate();
    };

    const currentStatus = meta.account_status || "Planning Phase";
    const statusColor = ({
        "Planning Phase": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        "Design Phase": "bg-discord-blurple/10 text-discord-blurple border-discord-blurple/20",
        "Production": "bg-orange-500/10 text-orange-400 border-orange-500/20",
        "Done": "bg-green-500/10 text-green-400 border-green-500/20",
    } as Record<string, string>)[currentStatus] || "bg-discord-bg text-discord-text-muted";

    return (
        <div className="bg-discord-sidebar rounded-lg p-4 border border-discord-dark hover:border-discord-blurple/30 transition-all shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-discord-text font-bold text-lg truncate pr-2">
                        {meta.client_name || meta.title || "Unknown Client"}
                    </h3>
                    {meta.company_name && (
                        <p className="text-discord-text-muted text-sm font-medium">
                            {meta.company_name}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(task)}
                        className="p-2 hover:bg-discord-item rounded-full text-discord-text-muted hover:text-discord-text transition-colors"
                        title="Edit Details"
                    >
                        <Edit2 size={16} />
                    </button>
                    {/* Status Pill */}
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                        {meta.type || 'ACCOUNT'}
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4">
                {/* Phone */}
                <div className="flex items-start gap-2 overflow-hidden">
                    <Phone size={14} className="text-discord-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-discord-text-muted uppercase">Contact</p>
                        <p className="text-sm text-discord-text truncate" title={meta.phone}>
                            {meta.phone || "—"}
                        </p>
                    </div>
                </div>

                {/* Call Date */}
                <div className="flex items-start gap-2 overflow-hidden">
                    <Calendar size={14} className="text-discord-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-discord-text-muted uppercase">Call Date</p>
                        <p className="text-sm text-discord-text truncate">
                            {meta.call_date ? format(new Date(meta.call_date), "MMM d, yyyy") : "—"}
                        </p>
                    </div>
                </div>

                {/* Budget */}
                <div className="flex items-start gap-2 overflow-hidden">
                    <DollarSign size={14} className="text-discord-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-discord-text-muted uppercase">Budget</p>
                        <p className="text-sm text-discord-text truncate">
                            {meta.budget ? `${meta.budget} EGP` : "—"}
                        </p>
                    </div>
                </div>

                {/* Shipping */}
                <div className="flex items-start gap-2 overflow-hidden">
                    <MapPin size={14} className="text-discord-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-discord-text-muted uppercase">Location</p>
                        <p className="text-sm text-discord-text truncate" title={meta.shipping_location}>
                            {meta.shipping_location || "—"}
                        </p>
                    </div>
                </div>

                {/* Services - Full Width */}
                <div className="col-span-2 flex items-start gap-2 overflow-hidden bg-discord-dark/30 p-2 rounded">
                    <Archive size={14} className="text-discord-text-muted mt-0.5 shrink-0" />
                    <div className="min-w-0 w-full">
                        <p className="text-[10px] font-bold text-discord-text-muted uppercase">Services</p>
                        <p className="text-sm text-discord-text text-wrap line-clamp-2">
                            {meta.services || "No services listed"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quote / Feedback */}
            {meta.feedback && (
                <div className="mb-4 bg-discord-item p-3 rounded text-sm text-discord-text-muted italic border-l-2 border-discord-blurple">
                    "{meta.feedback}"
                </div>
            )}

            {/* Design Phase Logic */}
            {currentStatus === 'Design Phase' && (
                <div className="mb-4">
                    {!meta.linked_design_task_id ? (
                        <div className="flex flex-col gap-2">
                            <div className="text-xs font-bold text-discord-blurple uppercase flex items-center gap-1">
                                <Paintbrush size={12} />
                                Design Phase
                            </div>
                            <Button
                                onClick={() => setShowCreateDesignDialog(true)}
                                className="w-full bg-discord-blurple hover:bg-discord-blurple/80 text-xs font-bold"
                            >
                                <Plus size={14} className="mr-2" />
                                CREATE DESIGNER TASK
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-discord-dark/50 rounded-lg p-3 border border-discord-dark">
                            <div className="text-xs font-bold text-discord-text-muted uppercase flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1">
                                    <Paintbrush size={12} className="text-discord-blurple" />
                                    Linked Design Work
                                </span>
                                {linkedTask ? (
                                    <span className="text-[10px] bg-discord-item px-1.5 py-0.5 rounded text-discord-text">
                                        {linkedTask.status}
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-discord-item px-1.5 py-0.5 rounded text-discord-text-muted italic">
                                        Not found
                                    </span>
                                )}
                            </div>

                            {linkedParts.length === 0 ? (
                                <p className="text-xs text-discord-text-muted italic">No checklist parts linked.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {linkedParts.map((part) => (
                                        <div key={part.id} className="flex items-center gap-2 text-xs">
                                            {/* Status Box */}
                                            <div className={`w-3 h-3 rounded-sm border shrink-0 ${part.manager_approved
                                                ? "bg-green-500 border-green-500"
                                                : part.designer_checked
                                                    ? "bg-discord-blurple border-discord-blurple"
                                                    : "border-discord-text-muted/30"
                                                }`} />
                                            <span className={`truncate ${part.manager_approved || part.designer_checked
                                                ? "text-discord-text"
                                                : "text-discord-text-muted ml-0.5"
                                                }`}>
                                                {part.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Footer with Status Dropdown */}
            <div className="pt-3 border-t border-discord-dark flex justify-between items-center bg-black/10 -mx-4 -mb-4 p-3 rounded-b-lg">
                <p className="text-xs font-bold text-discord-text-muted uppercase">Status</p>
                <div className="w-[160px]">
                    <Select value={currentStatus} onValueChange={handleStatusChange} disabled={updatingStatus}>
                        <SelectTrigger className="h-8 bg-discord-dark border-none text-xs text-discord-text">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-discord-sidebar border-discord-dark">
                            <SelectItem value="Planning Phase" className="text-xs text-discord-text">Planning Phase</SelectItem>
                            <SelectItem value="Design Phase" className="text-xs text-discord-text">Design Phase</SelectItem>
                            <SelectItem value="Production" className="text-xs text-discord-text">Production</SelectItem>
                            <SelectItem value="Done" className="text-xs text-discord-text">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <CreateTaskDialog
                open={showCreateDesignDialog}
                onOpenChange={setShowCreateDesignDialog}
                activeDepartment="design"
                onTaskCreated={handleDesignTaskCreated}
            />
        </div>
    );
}
