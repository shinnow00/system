"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Calculator, X, Receipt, Building2, Calendar, FileText } from "lucide-react";

interface FinanceDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: any;
}

export default function FinanceDetailDialog({
    open,
    onOpenChange,
    record,
}: FinanceDetailDialogProps) {
    if (!record) return null;

    const items = record.items || [];
    const subtotal = record.amount_base || 0;
    const vat = record.amount_vat || 0;
    const total = record.amount_total || 0;

    const statusColors: Record<string, string> = {
        Paid: "text-emerald-400 bg-emerald-400/10",
        Pending: "text-yellow-400 bg-yellow-400/10",
        Overdue: "text-red-400 bg-red-400/10",
        Cancelled: "text-discord-text-muted bg-discord-dark/50"
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[record.payment_status || 'Pending']}`}>
                            {record.payment_status || 'Pending'}
                        </span>
                        <span className="text-xs text-discord-text-muted flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(record.date).toLocaleDateString()}
                        </span>
                    </div>
                    <DialogTitle className="flex items-center gap-2 text-xl capitalize">
                        <Receipt className="text-emerald-500" />
                        Invoice Details
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Full breakdown for Invoice #{record.invoice_number}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-discord-dark/50 p-4 rounded-xl border border-white/5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-discord-text-muted uppercase tracking-widest">Supplier / Client</label>
                            <div className="flex items-center gap-2 text-discord-text">
                                <Building2 size={16} className="text-discord-blurple" />
                                <span className="font-medium">{record.supplier_name}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-discord-text-muted uppercase tracking-widest">Tax Reg #</label>
                            <div className="text-discord-text">
                                {record.tax_reg_number || "N/A"}
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-discord-text-muted uppercase tracking-widest">Description</label>
                            <div className="text-sm text-discord-text leading-relaxed">
                                {record.description}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} />
                            Line Items
                        </label>
                        <div className="rounded-xl overflow-hidden border border-white/5 bg-discord-dark/30">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-discord-dark text-discord-text-muted text-[10px] uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-3">Item Name</th>
                                        <th className="px-4 py-3 text-center">Qty</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.length > 0 ? (
                                        items.map((item: any, index: number) => (
                                            <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 font-medium">{item.name}</td>
                                                <td className="px-4 py-3 text-center text-discord-text-muted">{item.qty}</td>
                                                <td className="px-4 py-3 text-right">{item.price.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold">{(item.qty * item.price).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-discord-text-muted italic">
                                                No detailed items recorded for this transaction.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-discord-dark/50 rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-discord-text-muted">Subtotal</span>
                            <span className="font-medium">{subtotal.toLocaleString()} EGP</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-orange-400">VAT (Tax)</span>
                            <span className="font-medium text-orange-400">+{vat.toLocaleString()} EGP</span>
                        </div>
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Grand Total</span>
                            <span className="text-2xl font-bold text-emerald-400">{total.toLocaleString()} EGP</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
