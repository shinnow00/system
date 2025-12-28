"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Department } from "@/components/DiscordLayout";
import { Profile } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activeDepartment: Department;
    socialFilter?: string;
    onTaskCreated: () => void;
}

interface ChecklistPart {
    id: string;
    title: string;
}

export default function CreateTaskDialog({
    open,
    onOpenChange,
    activeDepartment,
    socialFilter = 'calendar',
    onTaskCreated,
}: CreateTaskDialogProps) {
    // Standard fields
    const [title, setTitle] = useState("");
    const [deadline, setDeadline] = useState<Date | undefined>();
    const [deptUsers, setDeptUsers] = useState<Profile[]>([]);
    const [designers, setDesigners] = useState<Profile[]>([]);
    const [assignedTo, setAssignedTo] = useState("");

    // Social Media fields
    const [socialTaskType, setSocialTaskType] = useState<'internal' | 'design'>('internal');
    const [platform, setPlatform] = useState("");
    const [contentType, setContentType] = useState("");
    const [tov, setTov] = useState("");
    const [referenceLink, setReferenceLink] = useState("");
    const [deliverables, setDeliverables] = useState<{ platform: string; type: string; tov: string; refLink: string }[]>([]);
    const [shootingScriptLink, setShootingScriptLink] = useState("");
    const [requireDesigner, setRequireDesigner] = useState(false);

    // Designers fields
    const [checklistItems, setChecklistItems] = useState<string[]>([]);
    const [newPartTitle, setNewPartTitle] = useState("");

    // Operations fields
    const [shippingLocation, setShippingLocation] = useState("");
    const [price, setPrice] = useState("");
    const [targetDepartment, setTargetDepartment] = useState<Department>(activeDepartment);
    const [clientName, setClientName] = useState("");
    const [companyName, setCompanyName] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Map internal department IDs to Database names
    const DEPT_MAP: Record<string, string> = {
        'design': 'Designers',
        'social': 'Social Media',
        'accounts': 'Account Managers',
        'ops': 'Operations',
        'hr': 'Hr',
        'superadmin': 'Admin'
    };

    // Fetch users for the dropdowns
    useEffect(() => {
        const fetchUsers = async () => {
            const supabase = createClient();

            // 1. Fetch Department Users
            const dbDept = DEPT_MAP[targetDepartment] || targetDepartment;
            const { data: deptData } = await supabase
                .from("profiles")
                .select("*")
                .eq('department', dbDept)
                .order("full_name", { ascending: true });

            setDeptUsers(deptData || []);

            // 2. If in Social tab, also fetch Designers for the Bottom Dropdown
            if (activeDepartment === 'social') {
                const { data: designerData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq('department', 'Designers')
                    .order("full_name", { ascending: true });

                setDesigners(designerData || []);
            }
        };
        if (open) fetchUsers();
    }, [open, targetDepartment, activeDepartment]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setTitle("");
            setDeadline(undefined);
            setAssignedTo("");
            setPlatform("");
            setContentType("");
            setTov("");
            setReferenceLink("");
            setChecklistItems([]);
            setNewPartTitle("");
            setShippingLocation("");
            setPrice("");
            setTargetDepartment(activeDepartment);
            setSocialTaskType('internal');
            setDeliverables([]);
            setClientName("");
            setCompanyName("");
            setShootingScriptLink("");
            setRequireDesigner(false);
            setError(null);
        }
    }, [open, activeDepartment]);

    // Add a checklist part
    const addChecklistPart = () => {
        if (!newPartTitle.trim()) return;
        setChecklistItems([...checklistItems, newPartTitle.trim()]);
        setNewPartTitle("");
    };

    // Add a deliverable (Social Design Request)
    const addDeliverable = () => {
        if (!platform || !contentType) return;
        setDeliverables([...deliverables, {
            platform,
            type: contentType,
            tov: tov || "N/A",
            refLink: referenceLink || "N/A"
        }]);
        // Reset sub-form
        setPlatform("");
        setContentType("");
        setTov("");
        setReferenceLink("");
    };

    // Remove a deliverable
    const removeDeliverable = (index: number) => {
        setDeliverables(deliverables.filter((_, i) => i !== index));
    };

    // Remove a checklist part
    const removeChecklistPart = (index: number) => {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const isShooting = activeDepartment === "social" && socialFilter === 'shooting';

        if (!isShooting && !title.trim()) {
            setError("Title is required");
            return;
        }

        if (isShooting && !clientName.trim()) {
            setError("Client Name is required");
            return;
        }

        if (activeDepartment === "social" && socialTaskType === "design" && !deadline) {
            setError("Deadline is required for Design Requests");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError("You must be logged in");
                setLoading(false);
                return;
            }

            // Build meta_data based on department
            const metaData: Record<string, unknown> = {};

            if (activeDepartment === "social") {
                const isShooting = socialFilter === 'shooting';

                if (isShooting) {
                    metaData.type = 'shooting';
                    metaData.client_name = clientName;
                    metaData.script_link = shootingScriptLink;
                    metaData.require_designer = requireDesigner;
                    metaData.shooting_status = 'Started';
                } else {
                    metaData.type = 'calendar';
                    if (platform) metaData.platform = platform;
                    if (contentType) metaData.content_type = contentType;
                    if (tov) metaData.tone_of_voice = tov;
                    if (referenceLink) metaData.reference_link = referenceLink;
                    if (socialTaskType === 'design') {
                        metaData.origin = 'social_request';
                    }
                    metaData.social_task_type = socialTaskType;
                }
            } else if (activeDepartment === "accounts" || targetDepartment === "ops") {
                if (shippingLocation) metaData.shipping_location = shippingLocation;
                if (price) metaData.price = parseFloat(price) || 0;
                if (clientName) metaData.client_name = clientName;
                if (companyName) metaData.company_name = companyName;
            } else if (targetDepartment === "design" && activeDepartment === "ops") {
                // Ops creating for Designers - pass the logistics info too
                if (clientName) metaData.client_name = clientName;
                if (companyName) metaData.company_name = companyName;
            }

            // Map department names to database values
            const departmentMap: Record<Department, string> = {
                design: "Designers",
                social: "Social Media",
                accounts: "Account Managers",
                hr: "Hr",
                ops: "Operations",
                superadmin: "Admin",
                home: "Home",
            };

            const finalTargetDept = (activeDepartment === 'social' && socialTaskType === 'design')
                ? 'design'
                : targetDepartment;

            // Insert task
            const isShootingTask = activeDepartment === "social" && socialFilter === 'shooting';
            const finalTitle = isShootingTask ? `[Shooting] ${clientName}` : title.trim();

            const taskObj: any = {
                title: finalTitle,
                department: departmentMap[finalTargetDept as Department],
                status: "Todo",
                deadline: deadline?.toISOString() || null,
                created_by: user.id,
                meta_data: Object.keys(metaData).length > 0 ? metaData : null,
            };

            // If we have an assigned user, we'll try to add it. 
            // If the INSERT fails with "column assigned_to does not exist", we'll know for sure.
            if (assignedTo) {
                taskObj.assigned_to = assignedTo;
            }

            const { data: newTask, error: taskError } = await supabase
                .from("tasks")
                .insert(taskObj)
                .select()
                .single();

            if (taskError) {
                console.error("Error creating task:", taskError);
                setError(`Failed to create task: ${taskError.message}`);
                setLoading(false);
                return;
            }

            // If Target is Designers and there are checklist parts, insert them
            const isDesignRequest = (activeDepartment === "social" && socialTaskType === "design");

            if ((targetDepartment === "design" || isDesignRequest) && newTask) {
                let partsToInsert: any[] = [];

                if (isDesignRequest && deliverables.length > 0) {
                    partsToInsert = deliverables.map((d) => ({
                        task_id: newTask.id,
                        title: `${d.platform} - ${d.type}`,
                        designer_checked: false,
                        manager_approved: false,
                        meta_data: {
                            platform: d.platform,
                            type: d.type,
                            tov: d.tov,
                            ref_link: d.refLink
                        }
                    }));
                } else if (!isDesignRequest && checklistItems.length > 0) {
                    partsToInsert = checklistItems.map((title) => ({
                        task_id: newTask.id,
                        title: title,
                        designer_checked: false,
                        manager_approved: false,
                    }));
                }

                if (partsToInsert.length > 0) {
                    const { error: partsError } = await supabase
                        .from("task_parts")
                        .insert(partsToInsert);

                    if (partsError) {
                        console.error("Error creating task parts:", partsError);
                    }
                }
            }

            // Success - close dialog and refresh
            onOpenChange(false);
            onTaskCreated();
        } catch (err) {
            console.error("Unexpected error:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Get department display name
    const getDepartmentLabel = () => {
        switch (activeDepartment) {
            case "design":
                return "Design Team";
            case "social":
                return "Social Media";
            case "accounts":
                return "Account Management";
            case "ops":
                return "Operations";
            default:
                return "Task";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-discord-dark max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-discord-text">
                        {activeDepartment === 'social' && socialFilter === 'shooting'
                            ? "New Shooting Project"
                            : `Create ${getDepartmentLabel()} Task`}
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Fill in the details below to create a new task.
                    </DialogDescription>
                </DialogHeader>

                {/* Social Media Department Switcher */}
                {activeDepartment === "social" && socialFilter !== 'shooting' && (
                    <div className="flex bg-discord-dark p-1 rounded-lg mb-4">
                        <button
                            type="button"
                            onClick={() => setSocialTaskType('internal')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${socialTaskType === 'internal'
                                ? "bg-discord-item text-white shadow-sm"
                                : "text-discord-text-muted hover:text-discord-text"
                                }`}
                        >
                            INTERNAL TASK
                        </button>
                        <button
                            type="button"
                            onClick={() => setSocialTaskType('design')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${socialTaskType === 'design'
                                ? "bg-discord-blurple text-white shadow-sm"
                                : "text-discord-text-muted hover:text-discord-text"
                                }`}
                        >
                            DESIGN REQUEST
                        </button>
                    </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Standard Fields */}
                    {!(activeDepartment === 'social' && socialFilter === 'shooting') && (
                        <div>
                            <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                placeholder={activeDepartment === "social" && socialTaskType === "design" ? "Project Name / Topic" : "Enter task title"}
                                required
                            />
                        </div>
                    )}

                    {activeDepartment === 'social' && socialFilter === 'shooting' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                    Client Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                    placeholder="Enter client name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                    Script Link
                                </label>
                                <input
                                    type="text"
                                    value={shootingScriptLink}
                                    onChange={(e) => setShootingScriptLink(e.target.value)}
                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                    placeholder="Enter script link"
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="require-designer"
                                    checked={requireDesigner}
                                    onChange={(e) => setRequireDesigner(e.target.checked)}
                                    className="w-4 h-4 bg-discord-dark border-none rounded text-discord-blurple focus:ring-offset-0 focus:ring-0"
                                />
                                <label htmlFor="require-designer" className="text-sm font-medium text-discord-text cursor-pointer">
                                    Require Designer?
                                </label>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                            Deadline {(activeDepartment === "social" && socialTaskType === "design") && <span className="text-red-400">*</span>}
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left bg-discord-dark border-none text-discord-text hover:bg-discord-item"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-discord-text-muted" />
                                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-discord-sidebar border-discord-dark">
                                <Calendar
                                    mode="single"
                                    selected={deadline}
                                    onSelect={setDeadline}
                                    initialFocus
                                    className="bg-discord-sidebar text-discord-text"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Assigned To - Hide if Social Design Request */}
                    {!(activeDepartment === 'social' && socialTaskType === 'design') && (
                        <div>
                            <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                Assigned To
                            </label>
                            <Select value={assignedTo} onValueChange={setAssignedTo}>
                                <SelectTrigger className="w-full bg-discord-dark border-none text-discord-text">
                                    <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent className="bg-discord-sidebar border-discord-dark">
                                    {deptUsers.map((user: any) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id}
                                            className="text-discord-text focus:bg-discord-item focus:text-discord-text"
                                        >
                                            {user.full_name || user.email}
                                        </SelectItem>
                                    ))}
                                    {deptUsers.length === 0 && (
                                        <div className="p-2 text-xs text-discord-text-muted italic">
                                            No users found in this department
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Target Department Selection (Only for Ops View) */}
                    {activeDepartment === "ops" && (
                        <div>
                            <label className="block text-xs font-bold text-discord-blurple uppercase tracking-wide mb-2">
                                For Which Department?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTargetDepartment("ops")}
                                    className={`px-3 py-2 rounded text-xs font-bold border transition-all ${targetDepartment === "ops"
                                        ? "bg-discord-blurple border-discord-blurple text-white"
                                        : "bg-discord-dark border-white/5 text-discord-text-muted"
                                        }`}
                                >
                                    MYSELF (OPS)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetDepartment("design")}
                                    className={`px-3 py-2 rounded text-xs font-bold border transition-all ${targetDepartment === "design"
                                        ? "bg-discord-blurple border-discord-blurple text-white"
                                        : "bg-discord-dark border-white/5 text-discord-text-muted"
                                        }`}
                                >
                                    DESIGNERS
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Social Media Fields */}
                    {activeDepartment === "social" && socialTaskType === "internal" && socialFilter !== 'shooting' && (
                        <>
                            <div className="border-t border-discord-dark pt-4">
                                <p className="text-xs font-bold text-discord-blurple uppercase tracking-wide mb-3">
                                    Social Media Details
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                    Platform
                                </label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger className="w-full bg-discord-dark border-none text-discord-text">
                                        <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-discord-sidebar border-discord-dark">
                                        <SelectItem value="Instagram" className="text-discord-text focus:bg-discord-item">
                                            Instagram
                                        </SelectItem>
                                        <SelectItem value="TikTok" className="text-discord-text focus:bg-discord-item">
                                            TikTok
                                        </SelectItem>
                                        <SelectItem value="LinkedIn" className="text-discord-text focus:bg-discord-item">
                                            LinkedIn
                                        </SelectItem>
                                        <SelectItem value="Facebook" className="text-discord-text focus:bg-discord-item">
                                            Facebook
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                    Content Type
                                </label>
                                <Select value={contentType} onValueChange={setContentType}>
                                    <SelectTrigger className="w-full bg-discord-dark border-none text-discord-text">
                                        <SelectValue placeholder="Select content type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-discord-sidebar border-discord-dark">
                                        <SelectItem value="Video" className="text-discord-text focus:bg-discord-item">
                                            Video
                                        </SelectItem>
                                        <SelectItem value="Image" className="text-discord-text focus:bg-discord-item">
                                            Image
                                        </SelectItem>
                                        <SelectItem value="Carousel" className="text-discord-text focus:bg-discord-item">
                                            Carousel
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                    Text Over Vision (TOV)
                                </label>
                                <input
                                    type="text"
                                    value={tov}
                                    onChange={(e) => setTov(e.target.value)}
                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                    placeholder="e.g., Professional, Casual, Fun"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                    Reference Link
                                </label>
                                <input
                                    type="url"
                                    value={referenceLink}
                                    onChange={(e) => setReferenceLink(e.target.value)}
                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                    placeholder="https://..."
                                />
                            </div>
                        </>
                    )}

                    {/* Social Media Design Request Deliverables */}
                    {activeDepartment === "social" && socialTaskType === "design" && (
                        <>
                            <div className="border-t border-discord-dark pt-4">
                                <p className="text-xs font-bold text-discord-blurple uppercase tracking-wide mb-3">
                                    Deliverables (Design Request)
                                </p>
                            </div>

                            <div className="bg-discord-dark/50 p-4 rounded-lg space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-discord-text-muted uppercase mb-1">
                                        Assign to Designer
                                    </label>
                                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                                        <SelectTrigger className="w-full bg-discord-dark border-none text-discord-text h-9">
                                            <SelectValue placeholder="Select Designer" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-discord-sidebar border-discord-dark">
                                            {designers.map((u: any) => (
                                                <SelectItem key={u.id} value={u.id} className="text-discord-text">
                                                    {u.full_name || u.email}
                                                </SelectItem>
                                            ))}
                                            {designers.length === 0 && (
                                                <div className="p-2 text-xs text-discord-text-muted italic">
                                                    No designers found
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-discord-text-muted uppercase mb-1">
                                            Platform
                                        </label>
                                        <Select value={platform} onValueChange={setPlatform}>
                                            <SelectTrigger className="w-full bg-discord-dark border-none text-discord-text h-9">
                                                <SelectValue placeholder="Social" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-discord-sidebar border-discord-dark">
                                                {['FB', 'IG', 'TikTok', 'LinkedIn'].map(p => (
                                                    <SelectItem key={p} value={p} className="text-discord-text">{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-discord-text-muted uppercase mb-1">
                                            Type
                                        </label>
                                        <Select value={contentType} onValueChange={setContentType}>
                                            <SelectTrigger className="w-full bg-discord-dark border-none text-discord-text h-9">
                                                <SelectValue placeholder="Format" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-discord-sidebar border-discord-dark">
                                                {['Video', 'Static', 'Carousel'].map(t => (
                                                    <SelectItem key={t} value={t} className="text-discord-text">{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-discord-text-muted uppercase mb-1">
                                        TOV (Tone of Voice)
                                    </label>
                                    <input
                                        type="text"
                                        value={tov}
                                        onChange={(e) => setTov(e.target.value)}
                                        className="w-full px-3 py-2 bg-discord-dark border-none rounded text-xs text-discord-text placeholder-discord-text-muted focus:ring-1 focus:ring-discord-blurple"
                                        placeholder="e.g. Fun / Professional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-discord-text-muted uppercase mb-1">
                                        Ref Link
                                    </label>
                                    <input
                                        type="url"
                                        value={referenceLink}
                                        onChange={(e) => setReferenceLink(e.target.value)}
                                        className="w-full px-3 py-2 bg-discord-dark border-none rounded text-xs text-discord-text placeholder-discord-text-muted focus:ring-1 focus:ring-discord-blurple"
                                        placeholder="https://..."
                                    />
                                </div>

                                <Button
                                    type="button"
                                    onClick={addDeliverable}
                                    className="w-full bg-discord-blurple hover:bg-discord-blurple/80 text-xs font-bold h-9"
                                    disabled={!platform || !contentType}
                                >
                                    <Plus size={16} className="mr-2" />
                                    ADD DELIVERABLE
                                </Button>
                            </div>

                            {deliverables.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {deliverables.map((item, index) => (
                                        <div
                                            key={`${item.platform}-${index}`}
                                            className="flex items-center gap-2 px-3 py-2 bg-discord-dark/80 rounded border border-white/5"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-discord-text text-xs font-bold truncate">
                                                    {item.platform} • {item.type}
                                                </p>
                                                <p className="text-discord-text-muted text-[10px] truncate">
                                                    TOV: {item.tov}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeDeliverable(index)}
                                                className="text-discord-text-muted hover:text-red-400 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Designers Fields - Checklist Parts */}
                    {targetDepartment === "design" && (
                        <>
                            <div className="border-t border-discord-dark pt-4">
                                <p className="text-xs font-bold text-discord-blurple uppercase tracking-wide mb-3">
                                    Checklist Parts
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                    Add Parts
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newPartTitle}
                                        onChange={(e) => setNewPartTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addChecklistPart();
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                        placeholder="e.g., Draft, Render, Final Polish"
                                    />
                                    <Button
                                        type="button"
                                        onClick={addChecklistPart}
                                        className="bg-discord-blurple hover:bg-discord-blurple/80"
                                    >
                                        <Plus size={18} />
                                    </Button>
                                </div>
                            </div>

                            {checklistItems.length > 0 && (
                                <div className="space-y-2">
                                    {checklistItems.map((item, index) => (
                                        <div
                                            key={`${item}-${index}`}
                                            className="flex items-center gap-2 px-3 py-2 bg-discord-dark rounded"
                                        >
                                            <span className="text-discord-text-muted text-sm">{index + 1}.</span>
                                            <span className="flex-1 text-discord-text text-sm">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeChecklistPart(index)}
                                                className="text-discord-text-muted hover:text-red-400 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Operations/Account Managers Fields */}
                    {(activeDepartment === "accounts" || targetDepartment === "ops" || (activeDepartment === "ops" && targetDepartment === "design")) && (
                        <>
                            <div className="border-t border-discord-dark pt-4">
                                <p className="text-xs font-bold text-discord-blurple uppercase tracking-wide mb-3">
                                    Logistics & Client Details
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                        Client Name
                                    </label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                        placeholder="Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                        placeholder="Company"
                                    />
                                </div>
                            </div>

                            {(targetDepartment === "ops" || activeDepartment === "accounts") && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                            Shipping Location
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingLocation}
                                            onChange={(e) => setShippingLocation(e.target.value)}
                                            className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                            placeholder="Enter address"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                            Price
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="bg-discord-item border-none text-discord-text hover:bg-discord-item/70"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-discord-blurple hover:bg-discord-blurple/80"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={16} />
                                    Creating...
                                </span>
                            ) : (
                                "Create Task"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
