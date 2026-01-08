"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Department } from "@/utils/departments";
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
    onTaskCreated: (task?: any) => void;
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
    const [clientName, setClientName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [opsType, setOpsType] = useState<'pricing' | 'order'>('pricing');
    const [opsItems, setOpsItems] = useState<{ name: string; qty: number; price: number }[]>([
        { name: "", qty: 1, price: 0 }
    ]);
    const opsGrandTotal = opsItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

    // Account Managers fields
    const [accountMode, setAccountMode] = useState<'inbound' | 'outbound'>('inbound');
    const [dealGranted, setDealGranted] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [callDate, setCallDate] = useState<Date | undefined>();
    const [feedback, setFeedback] = useState("");
    const [budget, setBudget] = useState("");
    const [services, setServices] = useState("");

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
            const dbDept = DEPT_MAP[activeDepartment] || activeDepartment;
            const { data: deptData } = await supabase
                .from("profiles")
                .select("*")
                .eq('department', dbDept)
                .order("full_name", { ascending: true });

            setDeptUsers(deptData || []);

            // 2. If in Social tab, also fetch Designers
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
    }, [open, activeDepartment]);

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
            setSocialTaskType('internal');
            setDeliverables([]);
            setClientName("");
            setCompanyName("");
            setAccountMode('inbound');
            setDealGranted(false);
            setPhoneNumber("");
            setCallDate(undefined);
            setFeedback("");
            setBudget("");
            setServices("");
            setShootingScriptLink("");
            setRequireDesigner(false);
            setOpsType('pricing');
            setOpsItems([{ name: "", qty: 1, price: 0 }]);
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

    // Operations Item Helpers
    const addOpsItem = () => {
        setOpsItems([...opsItems, { name: "", qty: 1, price: 0 }]);
    };

    const removeOpsItem = (index: number) => {
        if (opsItems.length <= 1) {
            setOpsItems([{ name: "", qty: 1, price: 0 }]);
            return;
        }
        setOpsItems(opsItems.filter((_, i) => i !== index));
    };

    const updateOpsItem = (index: number, field: string, value: any) => {
        const newItems = [...opsItems];
        (newItems[index] as any)[field] = value;
        setOpsItems(newItems);
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
            } else if (activeDepartment === "accounts" || activeDepartment === "ops") {
                if (activeDepartment === "ops") {
                    metaData.type = opsType;
                    metaData.client_name = clientName;
                    metaData.company_name = companyName;
                    metaData.items = opsItems;
                    metaData.total_price = opsGrandTotal;
                    if (opsType === 'order') {
                        metaData.location = shippingLocation;
                        if (deadline) metaData.deadline = deadline.toISOString();
                        metaData.ops_status = 'In Progress';
                    } else {
                        metaData.ops_status = 'Pending';
                    }
                } else {
                    if (shippingLocation) metaData.shipping_location = shippingLocation;
                    if (price) metaData.price = parseFloat(price) || 0;
                    if (clientName) metaData.client_name = clientName;
                    if (companyName) metaData.company_name = companyName;

                    if (activeDepartment === "accounts") {
                        metaData.type = accountMode;
                        metaData.deal_granted = dealGranted;
                        if (phoneNumber) metaData.phone = phoneNumber;
                        if (callDate) metaData.call_date = callDate;
                        if (feedback) metaData.feedback = feedback;
                        if (budget) metaData.budget = budget;
                        if (services) metaData.services = services;
                        metaData.account_status = 'Planning Phase';
                    }
                }
            }

            // Map department names to database values
            const departmentMap: Record<Department, string> = {
                design: "Designers",
                social: "Social Media",
                accounts: "Account Managers",
                hr: "Hr",
                ops: "Operations",
                finance: "Finance & Inventory",
                superadmin: "Admin",
                home: "Home",
            };

            const finalTargetDept = (activeDepartment === 'social' && socialTaskType === 'design')
                ? 'design'
                : activeDepartment;

            // Insert task
            const isShootingTask = activeDepartment === "social" && socialFilter === 'shooting';
            const isAccountTask = activeDepartment === "accounts";

            let finalTitle = title.trim();
            if (isShootingTask) {
                finalTitle = `[Shooting] ${clientName}`;
            } else if (isAccountTask) {
                const prefix = accountMode === 'inbound' ? '[Inbound]' : '[Outbound]';
                finalTitle = `${prefix} ${clientName || 'Unspecified Client'}`;
            } else if (activeDepartment === 'ops') {
                const prefix = opsType === 'order' ? '[Order]' : '[Pricing]';
                finalTitle = `${prefix} ${clientName || title || 'New Request'}`;
            }

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

            if ((finalTargetDept === "design" || isDesignRequest) && newTask) {
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
            onTaskCreated(newTask);
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
            <DialogContent className="bg-discord-sidebar border-discord-dark w-[95vw] max-w-md max-h-[95vh] overflow-y-auto p-4 sm:p-6">
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
                    {!(activeDepartment === 'social' && socialFilter === 'shooting') && activeDepartment !== 'accounts' && (
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

                    {/* Deadline - Hide for Accounts (shown in Deal Fields instead) */}
                    {activeDepartment !== 'accounts' && (
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
                    )}

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
                    {activeDepartment === "design" && (
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
                    {(activeDepartment === "accounts" || activeDepartment === "ops") && (
                        <>
                            <div className="border-t border-discord-dark pt-4">
                                <p className="text-xs font-bold text-discord-blurple uppercase tracking-wide mb-3">
                                    {activeDepartment === 'ops' ? 'Operations Details' : 'Logistics & Client Details'}
                                </p>
                            </div>

                            {activeDepartment === 'ops' && (
                                <div className="space-y-4 mb-4">
                                    <div className="flex bg-discord-dark p-1 rounded-lg mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setOpsType('pricing')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${opsType === 'pricing'
                                                ? "bg-discord-blurple text-white shadow-sm"
                                                : "text-discord-text-muted hover:text-discord-text"
                                                }`}
                                        >
                                            PRICING REQUEST
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOpsType('order')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${opsType === 'order'
                                                ? "bg-discord-blurple text-white shadow-sm"
                                                : "text-discord-text-muted hover:text-discord-text"
                                                }`}
                                        >
                                            NEW ORDER
                                        </button>
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
                                                Company
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

                                    {/* Item List */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide">
                                            Items List
                                        </label>
                                        {opsItems.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => updateOpsItem(index, 'name', e.target.value)}
                                                        className="w-full px-3 py-2 bg-discord-dark border-none rounded text-sm text-discord-text placeholder-discord-text-muted"
                                                        placeholder="Item name"
                                                    />
                                                </div>
                                                <div className="w-16">
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={(e) => updateOpsItem(index, 'qty', parseInt(e.target.value) || 0)}
                                                        className="w-full px-2 py-2 bg-discord-dark border-none rounded text-sm text-discord-text text-center"
                                                        placeholder="Qty"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) => updateOpsItem(index, 'price', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-2 bg-discord-dark border-none rounded text-sm text-discord-text text-right"
                                                        placeholder="Price (EGP)"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeOpsItem(index)}
                                                    className="p-2 text-discord-text-muted hover:text-red-400"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={addOpsItem}
                                            className="w-full border border-dashed border-discord-dark text-discord-text-muted hover:text-discord-text h-8 text-xs"
                                        >
                                            <Plus size={14} className="mr-1" /> Add Item
                                        </Button>
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-between items-center py-2 px-3 bg-discord-dark/50 rounded border border-white/5">
                                        <span className="text-xs font-bold text-discord-text-muted uppercase">Grand Total</span>
                                        <span className="text-sm font-bold text-emerald-400">{opsGrandTotal.toLocaleString()} EGP</span>
                                    </div>

                                    {/* Conditional Order fields */}
                                    {opsType === 'order' && (
                                        <div className="space-y-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                    Location
                                                </label>
                                                <input
                                                    type="text"
                                                    value={shippingLocation}
                                                    onChange={(e) => setShippingLocation(e.target.value)}
                                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                                    placeholder="Shipping Address"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                    Deadline
                                                </label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-start text-left bg-discord-dark border-none text-discord-text hover:bg-discord-item"
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-discord-text-muted" />
                                                            {deadline ? format(deadline, "PPP") : <span className="text-discord-text-muted">Pick a date</span>}
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
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeDepartment === "accounts" && (
                                <>
                                    <div className="flex bg-discord-dark p-1 rounded-lg mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setAccountMode('inbound')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${accountMode === 'inbound'
                                                ? "bg-discord-blurple text-white shadow-sm"
                                                : "text-discord-text-muted hover:text-discord-text"
                                                }`}
                                        >
                                            INBOUND
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAccountMode('outbound')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${accountMode === 'outbound'
                                                ? "bg-discord-blurple text-white shadow-sm"
                                                : "text-discord-text-muted hover:text-discord-text"
                                                }`}
                                        >
                                            OUTBOUND
                                        </button>
                                    </div>

                                    {/* Common Inputs */}
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

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="text"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                                placeholder="+1 234..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                Date of Call
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left bg-discord-dark border-none text-discord-text hover:bg-discord-item h-10 px-3"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-discord-text-muted" />
                                                        {callDate ? format(callDate, "PPP") : <span className="text-discord-text-muted">Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-discord-sidebar border-discord-dark">
                                                    <Calendar
                                                        mode="single"
                                                        selected={callDate}
                                                        onSelect={setCallDate}
                                                        initialFocus
                                                        className="bg-discord-sidebar text-discord-text"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                            Feedback / Notes
                                        </label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple min-h-[80px]"
                                            placeholder="Enter call notes or feedback..."
                                        />
                                    </div>

                                    {/* Outbound Logic: Deal Granted Checkbox */}
                                    {accountMode === 'outbound' && (
                                        <div className="flex items-center gap-3 py-4 border-b border-discord-dark/50">
                                            <input
                                                type="checkbox"
                                                id="deal-granted"
                                                checked={dealGranted}
                                                onChange={(e) => setDealGranted(e.target.checked)}
                                                className="w-4 h-4 bg-discord-dark border-none rounded text-discord-blurple focus:ring-offset-0 focus:ring-0"
                                            />
                                            <label htmlFor="deal-granted" className="text-sm font-medium text-discord-text cursor-pointer">
                                                Deal Granted?
                                            </label>
                                        </div>
                                    )}

                                    {/* Deal Fields: Show if Inbound OR (Outbound + Deal Granted) */}
                                    {(accountMode === 'inbound' || (accountMode === 'outbound' && dealGranted)) && (
                                        <div className="bg-discord-dark/30 p-4 rounded-lg mt-4 space-y-4 border border-discord-dark">
                                            <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">
                                                Deal Details
                                            </p>

                                            <div>
                                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                    Deadline (Estimated)
                                                </label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-start text-left bg-discord-dark border-none text-discord-text hover:bg-discord-item"
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-discord-text-muted" />
                                                            {deadline ? format(deadline, "PPP") : <span className="text-discord-text-muted">Pick a date</span>}
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

                                            <div>
                                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                    Shipping Location
                                                </label>
                                                <input
                                                    type="text"
                                                    value={shippingLocation}
                                                    onChange={(e) => setShippingLocation(e.target.value)}
                                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                                    placeholder="Address..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                    Budget (EGP)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={budget}
                                                    onChange={(e) => setBudget(e.target.value)}
                                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                                    placeholder="Expected budget (EGP)"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-discord-text-muted uppercase tracking-wide mb-2">
                                                    Services List
                                                </label>
                                                <textarea
                                                    value={services}
                                                    onChange={(e) => setServices(e.target.value)}
                                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple min-h-[60px]"
                                                    placeholder="List requested services..."
                                                />
                                            </div>
                                        </div>
                                    )}
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
