"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Task } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface EditAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    onTaskUpdated: () => void;
}

export default function EditAccountDialog({
    open,
    onOpenChange,
    task,
    onTaskUpdated,
}: EditAccountDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Fields
    const [clientName, setClientName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [accountMode, setAccountMode] = useState<'inbound' | 'outbound'>('inbound');
    const [dealGranted, setDealGranted] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [callDate, setCallDate] = useState<Date | undefined>();
    const [feedback, setFeedback] = useState("");
    const [budget, setBudget] = useState("");
    const [services, setServices] = useState("");
    const [deadline, setDeadline] = useState<Date | undefined>();
    const [shippingLocation, setShippingLocation] = useState("");

    useEffect(() => {
        if (open && task) {
            const meta = (task.meta_data as any) || {};
            setClientName(meta.client_name || "");
            setCompanyName(meta.company_name || "");
            setAccountMode(meta.type === 'outbound' ? 'outbound' : 'inbound');
            setDealGranted(!!meta.deal_granted);
            setPhoneNumber(meta.phone || "");
            setCallDate(meta.call_date ? new Date(meta.call_date) : undefined);
            setFeedback(meta.feedback || "");
            setBudget(meta.budget || "");
            setServices(meta.services || "");
            setDeadline(task.deadline ? new Date(task.deadline) : undefined);
            setShippingLocation(meta.shipping_location || "");
        }
    }, [open, task]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;

        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // Build updated metadata
            const currentMeta = (task.meta_data as any) || {};
            const updatedMeta = {
                ...currentMeta,
                client_name: clientName,
                company_name: companyName,
                type: accountMode,
                deal_granted: dealGranted,
                phone: phoneNumber,
                call_date: callDate,
                feedback: feedback,
                budget: budget,
                services: services,
                shipping_location: shippingLocation,
            };

            // Update Task
            const { error: updateError } = await supabase
                .from("tasks")
                .update({
                    deadline: deadline?.toISOString() || null,
                    meta_data: updatedMeta
                })
                .eq("id", task.id);

            if (updateError) {
                console.error("Error updating task:", updateError);
                setError("Failed to update task");
            } else {
                onTaskUpdated();
                onOpenChange(false);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-discord-dark max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-discord-text">Edit Account Details</DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Update information for {task?.title}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdate} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

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

                    <div className="grid grid-cols-2 gap-4">
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

                    <div>
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

                    {accountMode === 'outbound' && (
                        <div className="flex items-center gap-3 py-4 border-b border-discord-dark/50">
                            <input
                                type="checkbox"
                                id="edit-deal-granted"
                                checked={dealGranted}
                                onChange={(e) => setDealGranted(e.target.checked)}
                                className="w-4 h-4 bg-discord-dark border-none rounded text-discord-blurple focus:ring-offset-0 focus:ring-0"
                            />
                            <label htmlFor="edit-deal-granted" className="text-sm font-medium text-discord-text cursor-pointer">
                                Deal Granted?
                            </label>
                        </div>
                    )}

                    {(accountMode === 'inbound' || (accountMode === 'outbound' && dealGranted)) && (
                        <div className="bg-discord-dark/30 p-4 rounded-lg space-y-4 border border-discord-dark">
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
                                    Budget
                                </label>
                                <input
                                    type="text"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    className="w-full px-3 py-2 bg-discord-dark border-none rounded text-discord-text placeholder-discord-text-muted focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                                    placeholder="Expected budget"
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
                                    Saving...
                                </span>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
