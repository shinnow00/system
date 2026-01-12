"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Package,
    Truck,
    MapPin,
    DollarSign,
    Calendar,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle2,
    MoreHorizontal,
    Edit3,
    Users
} from "lucide-react";
import { format } from "date-fns";
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
    SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { CalendarIcon, Paintbrush, Plus } from "lucide-react";
import { Task, TaskPart } from "@/types/database";
import CreateTaskDialog from "@/components/CreateTaskDialog";

export default function OpsTrackingBoard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Update Logistics Dialog
    const [logisticsDialogOpen, setLogisticsDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [updating, setUpdating] = useState(false);

    // Edit fields
    const [editPrice, setEditPrice] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editDeadline, setEditDeadline] = useState<Date | undefined>();
    const [editStatus, setEditStatus] = useState<string>("Todo");
    const [editOpsStatus, setEditOpsStatus] = useState<string>("In Progress");

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data, error: fetchError } = await supabase
                .from("tasks")
                .select("*")
                .eq("department", "Operations")
                .order("created_at", { ascending: false });

            if (fetchError) throw fetchError;
            setTasks(data || []);
        } catch (err: any) {
            console.error("Error fetching Ops tasks:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openUpdateDialog = (task: Task) => {
        setSelectedTask(task);
        setEditPrice(String(task.meta_data?.price || ""));
        setEditLocation(String(task.meta_data?.location || task.meta_data?.shipping_location || ""));
        setEditDeadline(task.deadline ? new Date(task.deadline) : undefined);
        setEditStatus(task.status);
        setEditOpsStatus((task.meta_data?.ops_status as string) || "In Progress");
        setLogisticsDialogOpen(true);
    };

    const handleUpdateLogistics = async () => {
        if (!selectedTask) return;
        setUpdating(true);
        setError(null);

        const supabase = createClient();
        const isConverting = selectedTask.meta_data?.type === 'pricing';

        const newMetaData: any = {
            ...(selectedTask.meta_data || {}),
            price: parseFloat(editPrice) || selectedTask.meta_data?.total_price || 0,
            location: editLocation,
            ops_status: editOpsStatus,
        };

        if (isConverting) {
            newMetaData.type = 'order';
            newMetaData.ops_status = 'In Progress';
        }

        try {
            const updatePayload: any = {
                status: editOpsStatus === "Done" ? "Done" : "In Progress",
                meta_data: newMetaData,
                updated_at: new Date().toISOString()
            };

            if (editDeadline) {
                updatePayload.deadline = editDeadline.toISOString();
            }

            const { error: updateError } = await supabase
                .from("tasks")
                .update(updatePayload)
                .eq("id", selectedTask.id);

            if (updateError) throw updateError;

            setLogisticsDialogOpen(false);
            fetchTasks();
        } catch (err: any) {
            console.error("Error updating logistics:", err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.meta_data?.client_name as string || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.meta_data?.company_name as string || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && tasks.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-discord-bg">
                <Loader2 className="animate-spin text-discord-blurple" size={40} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-discord-bg overflow-hidden uppercase-none">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-discord-sidebar/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Package className="text-yellow-500" size={28} />
                            <h1 className="text-2xl font-bold text-discord-text tracking-tight">Operations Control</h1>
                        </div>
                        <p className="text-discord-text-muted text-sm">Logistics Monitoring & Shipment Tracking</p>
                    </div>

                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-muted group-focus-within:text-discord-blurple transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search shipments, clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-discord-dark border border-white/5 rounded-full pl-10 pr-4 py-2.5 text-sm text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-blurple/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Tasks Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTasks.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-discord-text-muted">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} />
                            </div>
                            <p className="text-lg font-medium">No results found</p>
                            <p className="text-sm">Try adjusting your search query</p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <ShipmentCard
                                key={task.id}
                                task={task}
                                onOpenDetail={() => openUpdateDialog(task)}
                                onRefresh={fetchTasks}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Logistics Dialog */}
            <Dialog open={logisticsDialogOpen} onOpenChange={setLogisticsDialogOpen}>
                <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
                            <Truck className="text-discord-blurple" size={22} />
                            Logistics Update
                        </DialogTitle>
                        <DialogDescription className="text-discord-text-muted">
                            Setting up fulfillment details for: <span className="text-discord-text font-bold underline decoration-discord-blurple">{selectedTask?.title}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Status Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-discord-text-muted uppercase tracking-widest">Operations Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {["In Progress", "Design Phase", "Production", "Done"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setEditOpsStatus(status)}
                                        className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all ${editOpsStatus === status
                                            ? "bg-discord-blurple border-discord-blurple text-white shadow-lg shadow-discord-blurple/20"
                                            : "bg-discord-dark border-white/10 text-discord-text-muted hover:border-discord-blurple/50"
                                            }`}
                                    >
                                        {status.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedTask?.meta_data?.type === 'pricing' && (
                            <div className="p-3 bg-discord-blurple/10 border border-discord-blurple/30 rounded-lg">
                                <p className="text-xs font-bold text-discord-blurple mb-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> CONVERTING TO ORDER
                                </p>
                                <p className="text-[10px] text-discord-text-muted leading-relaxed">
                                    This task will be upgraded from a Pricing Request to an active Order. Please provide the fulfillment details below.
                                </p>
                            </div>
                        )}

                        {/* Deadline Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Deadline
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left bg-discord-dark border-white/10 text-discord-text hover:bg-discord-item h-11"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-discord-text-muted" />
                                        {editDeadline ? format(editDeadline, "PPP") : <span className="text-discord-text-muted">Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-discord-sidebar border-white/10">
                                    <CalendarUI
                                        mode="single"
                                        selected={editDeadline}
                                        onSelect={(date) => setEditDeadline(date)}
                                        initialFocus
                                        className="bg-discord-sidebar text-discord-text"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Shipping Location Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} /> Shipping Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-muted" size={16} />
                                <input
                                    type="text"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    placeholder="Enter physical address..."
                                    className="w-full bg-discord-dark border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-discord-blurple/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Optional Price Adjustment */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                                <div className="text-xs font-bold">EGP</div> Final Price Adjustment
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-muted text-xs font-bold">EGP</div>
                                <input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-discord-dark border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-discord-blurple/50 transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLogisticsDialogOpen(false)}
                            className="bg-transparent border-white/10 text-discord-text hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateLogistics}
                            disabled={updating}
                            className="bg-discord-blurple hover:bg-discord-blurple/80 text-white font-bold px-6"
                        >
                            {updating ? <Loader2 className="animate-spin" size={18} /> : "Record Logistics"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ShipmentCard({ task, onOpenDetail, onRefresh }: { task: Task; onOpenDetail: () => void; onRefresh: () => void }) {
    const [linkedTask, setLinkedTask] = useState<Task | null>(null);
    const [linkedParts, setLinkedParts] = useState<TaskPart[]>([]);
    const [showCreateDesignDialog, setShowCreateDesignDialog] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const meta = (task.meta_data as any) || {};
    const clientName = (meta.client_name as string) || "Individual Client";
    const companyName = (meta.company_name as string) || "";
    const items = (meta.items as any[]) || [];
    const grandTotal = (meta.total_price as number) || 0;
    const location = (meta.location as string) || (meta.shipping_location as string) || "TBD";
    const opsStatus = (meta.ops_status as string) || "In Progress";
    const taskType = (meta.type as string) || "pricing";

    useEffect(() => {
        if (meta.linked_design_task_id) {
            fetchLinkedTask(meta.linked_design_task_id);
        }
    }, [meta.linked_design_task_id]);

    const fetchLinkedTask = async (linkedId: string) => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("tasks")
            .select("*, task_parts(*)")
            .eq("id", linkedId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching linked task:", error);
            return;
        }

        if (!data) {
            setLinkedTask(null);
            setLinkedParts([]);
            return;
        }

        if (data) {
            const { task_parts, ...cleanTask } = data as any;
            setLinkedTask(cleanTask);
            setLinkedParts((task_parts || []) as TaskPart[]);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        setUpdatingStatus(true);
        const supabase = createClient();
        const updatedMeta = { ...meta, ops_status: newStatus };

        try {
            const { error } = await supabase
                .from("tasks")
                .update({
                    status: newStatus === "Done" ? "Done" : "In Progress",
                    meta_data: updatedMeta,
                })
                .eq("id", task.id);

            if (error) throw error;
            onRefresh(); // Refresh data without opening the dialog
        } catch (err) {
            console.error("Error updating status:", err);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDesignTaskCreated = async (newTask?: any) => {
        if (!newTask) return;
        const supabase = createClient();
        const updatedMeta = { ...meta, linked_design_task_id: newTask.id };

        await supabase
            .from("tasks")
            .update({ meta_data: updatedMeta })
            .eq("id", task.id);

        onRefresh();
    };

    return (
        <div
            onClick={onOpenDetail}
            className="bg-discord-sidebar group hover:bg-discord-sidebar/80 rounded-xl border border-white/5 hover:border-discord-blurple/30 transition-all duration-300 overflow-hidden flex flex-col shadow-lg hover:shadow-discord-blurple/5 cursor-pointer"
        >
            {/* Status Indicator Bar */}
            <div className={`h-1.5 w-full ${opsStatus === "Done" ? "bg-green-500" :
                opsStatus === "Production" ? "bg-orange-500" :
                    opsStatus === "Design Phase" ? "bg-pink-500" :
                        opsStatus === "In Progress" ? "bg-discord-blurple" : "bg-discord-text-muted/30"
                }`} />

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-discord-dark rounded-lg border border-white/5">
                        <Package className="text-discord-text-muted group-hover:text-yellow-500 transition-colors" size={20} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${taskType === 'order' ? 'bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                            {taskType.toUpperCase()}
                        </span>
                        <div className="w-[140px]" onClick={(e) => e.stopPropagation()}>
                            <Select value={opsStatus} onValueChange={handleStatusChange} disabled={updatingStatus}>
                                <SelectTrigger className="h-6 bg-discord-dark border-none text-[9px] text-discord-text-muted uppercase font-bold px-2 py-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-discord-sidebar border-discord-dark">
                                    <SelectItem value="In Progress" className="text-[10px] text-discord-text">IN PROGRESS</SelectItem>
                                    <SelectItem value="Design Phase" className="text-[10px] text-discord-text">DESIGN PHASE</SelectItem>
                                    <SelectItem value="Production" className="text-[10px] text-discord-text">PRODUCTION</SelectItem>
                                    <SelectItem value="Done" className="text-[10px] text-discord-text">DONE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-bold text-discord-text leading-tight mb-1 group-hover:text-discord-blurple transition-colors">
                        {clientName}
                    </h3>
                    {companyName && (
                        <div className="text-xs text-discord-text-muted font-bold flex items-center gap-1.5">
                            <Users size={12} className="text-discord-blurple" />
                            {companyName}
                        </div>
                    )}
                </div>

                {/* Items Table */}
                {items.length > 0 && (
                    <div className="mb-4 bg-discord-dark/50 rounded-lg border border-white/5 overflow-hidden">
                        <table className="w-full text-[10px] text-left border-collapse">
                            <thead className="bg-discord-dark text-discord-text-muted uppercase font-black">
                                <tr>
                                    <th className="px-2 py-1.5">Item</th>
                                    <th className="px-1 py-1.5 text-center">Qty</th>
                                    <th className="px-2 py-1.5 text-right">Price</th>
                                    <th className="px-2 py-1.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="text-discord-text-muted">
                                        <td className="px-2 py-1.5 truncate max-w-[80px]" title={item.name}>{item.name}</td>
                                        <td className="px-1 py-1.5 text-center">{item.qty}</td>
                                        <td className="px-2 py-1.5 text-right">{(item.price || 0).toFixed(0)} EGP</td>
                                        <td className="px-2 py-1.5 text-right font-bold text-discord-text">{((item.qty || 0) * (item.price || 0)).toFixed(0)} EGP</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Design Phase Logic */}
                {opsStatus === 'Design Phase' && (
                    <div className="mb-4">
                        {!meta.linked_design_task_id ? (
                            <div className="flex flex-col gap-2">
                                <div className="text-[10px] font-black text-discord-blurple uppercase flex items-center gap-1.5">
                                    <Paintbrush size={12} />
                                    Design Phase
                                </div>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCreateDesignDialog(true);
                                    }}
                                    className="w-full bg-discord-blurple hover:bg-discord-blurple/80 text-[10px] font-black h-8"
                                >
                                    <Plus size={14} className="mr-2" />
                                    CREATE DESIGNER TASK
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-discord-dark/50 rounded-lg p-3 border border-white/5">
                                <div className="text-[10px] font-black text-discord-text-muted uppercase flex items-center justify-between mb-2">
                                    <span className="flex items-center gap-1.5">
                                        <Paintbrush size={12} className="text-discord-blurple" />
                                        Linked Design
                                    </span>
                                    {linkedTask ? (
                                        <span className="text-[9px] bg-discord-dark px-1.5 py-0.5 rounded text-discord-text border border-white/5">
                                            {linkedTask.status}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] bg-discord-dark px-1.5 py-0.5 rounded text-discord-text-muted border border-white/5 italic">
                                            Not Found
                                        </span>
                                    )}
                                </div>

                                {linkedParts.length === 0 ? (
                                    <p className="text-[10px] text-discord-text-muted italic">No deliverables tracked.</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {linkedParts.map((part) => (
                                            <div key={part.id} className="flex items-center gap-2 text-xs">
                                                <div className={`w-3 h-3 rounded-sm border shrink-0 ${part.manager_approved
                                                    ? "bg-green-500 border-green-500"
                                                    : part.designer_checked
                                                        ? "bg-discord-blurple border-discord-blurple"
                                                        : "border-white/10"
                                                    }`} />
                                                <span className={`text-[10px] font-bold truncate ${part.manager_approved || part.designer_checked
                                                    ? "text-discord-text"
                                                    : "text-discord-text-muted"
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

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-discord-dark/50 p-2.5 rounded-lg border border-white/5">
                        <div className="text-[9px] font-black text-discord-text-muted uppercase tracking-tighter mb-1">Grand Total</div>
                        <div className="text-sm font-bold text-green-400 font-mono">
                            ${grandTotal.toLocaleString()}
                        </div>
                    </div>
                    {location && location !== "TBD" && (
                        <div className="bg-discord-dark/50 p-2.5 rounded-lg border border-white/5 overflow-hidden">
                            <div className="text-[9px] font-black text-discord-text-muted uppercase tracking-tighter mb-1 flex items-center gap-1">
                                <MapPin size={9} /> Location
                            </div>
                            <div className="text-xs font-bold text-discord-text truncate" title={location}>
                                {location}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="text-[9px] font-black text-discord-text-muted uppercase tracking-widest mb-1">Target Date</div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-discord-text">
                            <Calendar size={12} className="text-discord-text-muted" />
                            {task.deadline ? format(new Date(task.deadline), "MMM dd") : "No Date"}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {taskType === 'pricing' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDetail();
                                }}
                                className="px-3 py-1.5 bg-discord-blurple hover:bg-discord-blurple/80 text-white text-[10px] font-black rounded-lg transition-all"
                            >
                                CONVERT TO ORDER
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenDetail();
                            }}
                            className="p-2.5 bg-discord-dark hover:bg-discord-item text-discord-text-muted hover:text-discord-text rounded-lg transition-all"
                        >
                            <Edit3 size={18} />
                        </button>
                    </div>
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
