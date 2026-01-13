'use client';

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
import { Loader2, Save, X, CreditCard, Wallet, Banknote, Landmark } from "lucide-react";
import { toast } from "sonner";

interface CompleteTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: any;
    onSuccess: () => void;
}

const TRANSACTION_METHODS = [
    { id: 'Instapay', icon: <Landmark size={16} /> },
    { id: 'Bank Transfer', icon: <Landmark size={16} /> },
    { id: 'Ewallet', icon: <Wallet size={16} /> },
    { id: 'Credit Card', icon: <CreditCard size={16} /> },
    { id: 'Cash', icon: <Banknote size={16} /> },
    { id: 'Other', icon: <X size={16} /> },
];

export default function CompleteTransactionDialog({
    open,
    onOpenChange,
    transaction,
    onSuccess,
}: CompleteTransactionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        transaction_method: "",
        deduction_profit: 0,
        notes: "",
    });

    useEffect(() => {
        if (open && transaction) {
            setForm({
                transaction_method: transaction.transaction_method || "Instapay",
                deduction_profit: transaction.deduction_profit || 0,
                notes: transaction.notes || "",
            });
            setError(null);
        }
    }, [open, transaction]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();

        try {
            // 1. Update Treasury Table
            const { error: treasuryError } = await supabase
                .from("treasury")
                .update({
                    status: 'Completed',
                    transaction_method: form.transaction_method,
                    deduction_profit: Number(form.deduction_profit),
                    notes: form.notes
                })
                .eq("id", transaction.id);

            if (treasuryError) throw treasuryError;

            // 2. Update Finance Table (Sync)
            if (transaction.finance_id) {
                const newStatus = transaction.type === 'collection' ? 'Collected' : 'Paid';
                const { error: financeError } = await supabase
                    .from("finance")
                    .update({ payment_status: newStatus })
                    .eq("id", transaction.finance_id);

                if (financeError) throw financeError;
            }

            toast.success("Transaction completed and synced with Finance!");
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error completing transaction:", err);
            setError(err.message || "Failed to complete transaction.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CreditCard className="text-emerald-500" />
                        Complete Transaction
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Finalize this {transaction?.type} for {transaction?.client_name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider">Transaction Method</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TRANSACTION_METHODS.map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setForm({ ...form, transaction_method: method.id })}
                                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-sm ${form.transaction_method === method.id
                                            ? "bg-discord-blurple border-discord-blurple text-white shadow-lg"
                                            : "bg-discord-dark border-white/5 text-discord-text-muted hover:border-white/20"
                                        }`}
                                >
                                    {method.icon}
                                    {method.id}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider">Deduction of Profits (EGP)</label>
                        <input
                            type="number"
                            value={form.deduction_profit}
                            onChange={(e) => setForm({ ...form, deduction_profit: Number(e.target.value) })}
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider">Notes</label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none resize-none"
                            placeholder="Add any internal transaction details..."
                        />
                    </div>

                    <DialogFooter className="pt-4 border-t border-white/5 mt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-discord-text-muted hover:text-discord-text"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Save Completion
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
