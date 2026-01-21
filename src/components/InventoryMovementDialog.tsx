"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Package, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface InventoryMovementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inventoryItem: any;
    onSuccess: () => void;
}

export default function InventoryMovementDialog({
    open,
    onOpenChange,
    inventoryItem,
    onSuccess,
}: InventoryMovementDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [type, setType] = useState<'In' | 'Out'>('In');
    const [amount, setAmount] = useState<number>(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState("");

    useEffect(() => {
        if (open) {
            setType('In');
            setAmount(0);
            setDate(new Date().toISOString().split('T')[0]);
            setReference("");
            setError(null);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) {
            setError("Amount must be greater than zero.");
            return;
        }

        setLoading(true);
        setError(null);

        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Calculate new balance
            const currentBalance = inventoryItem.balance || 0;
            const newBalance = type === 'In' ? currentBalance + amount : currentBalance - amount;

            if (type === 'Out' && newBalance < 0) {
                throw new Error("Insufficient stock for this movement.");
            }

            // 2. Update inventory record
            const updatePayload: any = {
                balance: newBalance,
            };

            if (type === 'In') {
                updatePayload.in_go = (inventoryItem.in_go || 0) + amount;
            } else {
                updatePayload.out_go = (inventoryItem.out_go || 0) + amount;
            }

            const { error: updateError } = await supabase
                .from("inventory")
                .update(updatePayload)
                .eq("id", inventoryItem.id);

            if (updateError) throw updateError;

            // 3. Insert log
            const { error: logError } = await supabase
                .from("inventory_logs")
                .insert({
                    inventory_id: inventoryItem.id,
                    user_id: user.id,
                    type,
                    amount,
                    date,
                    reference,
                    previous_balance: currentBalance,
                    new_balance: newBalance
                });

            if (logError) throw logError;

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error processing movement:", err);
            setError(err.message || "Failed to process movement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Package className="text-emerald-500" />
                        Move Stock: {inventoryItem?.item_name}
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Record a stock movement for this item.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Type Toggle */}
                        <div className="flex bg-discord-dark rounded-lg p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setType('In')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${type === 'In'
                                    ? "bg-emerald-600 text-white shadow-lg"
                                    : "text-discord-text-muted hover:text-discord-text"
                                    }`}
                            >
                                <ArrowUpRight size={18} />
                                Check-In
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('Out')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${type === 'Out'
                                    ? "bg-red-600 text-white shadow-lg"
                                    : "text-discord-text-muted hover:text-discord-text"
                                    }`}
                            >
                                <ArrowDownRight size={18} />
                                Check-Out
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase">Amount</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            />
                        </div>

                        <div className="space-y-2 flex flex-col">
                            <label className="text-xs font-bold text-discord-text-muted uppercase">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-discord-dark border-none text-discord-text hover:bg-discord-item h-[48px]",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(new Date(date), "dd-MM-yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-discord-sidebar border-discord-dark" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date ? new Date(date) : undefined}
                                        onSelect={(d) => setDate(d ? d.toISOString() : '')}
                                        initialFocus
                                        className="bg-discord-sidebar text-discord-text"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Reference */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase">
                                {type === 'In' ? 'Invoice Number' : 'Event Name'}
                            </label>
                            <input
                                required
                                type="text"
                                placeholder={type === 'In' ? 'INV-00123' : 'Project Launch'}
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-black/20 rounded-lg p-3 flex justify-between items-center text-sm">
                            <span className="text-discord-text-muted">Current Balance:</span>
                            <span className="font-bold">{inventoryItem?.balance || 0}</span>
                        </div>
                        <div className="bg-discord-blurple/10 rounded-lg p-3 flex justify-between items-center text-sm border border-discord-blurple/20">
                            <span className="text-discord-blurple font-semibold uppercase text-xs">New Balance:</span>
                            <span className="font-bold text-lg">
                                {type === 'In' ? (inventoryItem?.balance || 0) + amount : (inventoryItem?.balance || 0) - amount}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-discord-text-muted hover:text-discord-text hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`min-w-[120px] ${type === 'In' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Confirm
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
