"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Package, ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

interface InventoryLog {
    id: string;
    date: string;
    type: 'In' | 'Out';
    amount: number;
    reference: string;
    previous_balance: number;
    new_balance: number;
    profiles: {
        full_name: string;
    } | null;
}

interface InventoryHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inventoryItem: any;
}

export default function InventoryHistoryDialog({
    open,
    onOpenChange,
    inventoryItem,
}: InventoryHistoryDialogProps) {
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && inventoryItem) {
            fetchLogs();
        }
    }, [open, inventoryItem]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            const { data, error: fetchError } = await supabase
                .from("inventory_logs")
                .select(`
                    *,
                    profiles (full_name)
                `)
                .eq("inventory_id", inventoryItem.id)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false });

            if (fetchError) throw fetchError;
            setLogs(data || []);
        } catch (err: any) {
            console.error("Error fetching logs:", err);
            setError(err.message || "Failed to load history.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <History className="text-discord-blurple" />
                        Movement History: {inventoryItem?.item_name}
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Full transaction log for item code: {inventoryItem?.item_code}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto mt-4 px-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-discord-blurple" size={32} />
                            <p className="text-discord-text-muted">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                            <p className="text-red-400 font-medium">{error}</p>
                            <button
                                onClick={fetchLogs}
                                className="mt-4 text-sm text-discord-text underline hover:text-white"
                            >
                                Try again
                            </button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-black/10 rounded-xl border-2 border-dashed border-white/5">
                            <History size={48} className="text-discord-text-muted/20 mb-3" />
                            <p className="text-discord-text-muted">No movement history found for this item.</p>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-white/5 overflow-hidden">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-black/20 text-discord-text-muted text-xs uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {formatDate(log.date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`flex items-center gap-1 font-bold ${log.type === 'In' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {log.type === 'In' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                    {log.type.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono font-bold">
                                                {log.amount}
                                            </td>
                                            <td className="px-4 py-3 text-discord-text-muted truncate max-w-[150px]">
                                                {log.reference}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-discord-dark px-2 py-0.5 rounded text-xs">
                                                    {log.profiles?.full_name || 'System'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-discord-text">{log.new_balance}</span>
                                                    <span className="text-[10px] text-discord-text-muted">
                                                        from {log.previous_balance}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
