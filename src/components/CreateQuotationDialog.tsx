"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calculator, FileText, User, Building2, Calendar, Loader2 } from "lucide-react";

interface Item {
    name: string;
    qty: number;
    price: number;
}

interface CreateQuotationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    taskToEdit?: any;
}

export default function CreateQuotationDialog({ open, onOpenChange, onSuccess, taskToEdit }: CreateQuotationDialogProps) {
    const [clientName, setClientName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<Item[]>([{ name: "", qty: 1, price: 0 }]);
    const [taxRate, setTaxRate] = useState(14);
    const [terms, setTerms] = useState<string[]>(["Payment: 50% upfront, 50% upon delivery."]);
    const [notes, setNotes] = useState<string[]>(["Quotation valid for 30 days."]);
    const [isSaving, setIsSaving] = useState(false);

    // Populate state when editing
    useEffect(() => {
        if (taskToEdit && open) {
            const meta = taskToEdit.meta_data || {};
            setClientName(meta.client_name || "");
            setCompanyName(meta.company_name || "");
            setDate(meta.quotation_date || new Date().toISOString().split('T')[0]);
            setItems(meta.items || [{ name: "", qty: 1, price: 0 }]);
            setTaxRate(meta.tax_rate || 14);
            setTerms(meta.terms || ["Payment: 50% upfront, 50% upon delivery."]);
            setNotes(meta.notes || ["Quotation valid for 30 days."]);
        } else if (open) {
            // Reset for new quotation
            setClientName("");
            setCompanyName("");
            setDate(new Date().toISOString().split('T')[0]);
            setItems([{ name: "", qty: 1, price: 0 }]);
            setTaxRate(14);
            setTerms(["Payment: 50% upfront, 50% upon delivery."]);
            setNotes(["Quotation valid for 30 days."]);
        }
    }, [taskToEdit, open]);

    // Math Logic
    const totals = useMemo(() => {
        const subTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
        const taxAmount = subTotal * (taxRate / 100);
        const grandTotal = subTotal + taxAmount;
        return { subTotal, taxAmount, grandTotal };
    }, [items, taxRate]);

    // Item Handlers
    const addItem = () => setItems([...items, { name: "", qty: 1, price: 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const updateItem = (index: number, field: keyof Item, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    // Terms/Notes Handlers
    const addListEntry = (setter: Function, list: string[]) => setter([...list, ""]);
    const updateListEntry = (setter: Function, list: string[], index: number, value: string) => {
        const newList = [...list];
        newList[index] = value;
        setter(newList);
    };
    const removeListEntry = (setter: Function, list: string[], index: number) => setter(list.filter((_, i) => i !== index));

    const handleSave = async () => {
        if (!clientName) {
            alert("Please provide a client name.");
            return;
        }

        setIsSaving(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const quotationData: any = {
                title: `Quotation: ${clientName} - ${companyName || 'Individual'}`,
                department: 'Operations' as const,
                status: 'Todo',
                meta_data: {
                    type: 'quotation',
                    client_name: clientName,
                    company_name: companyName,
                    quotation_date: date,
                    items,
                    tax_rate: taxRate,
                    tax_amount: totals.taxAmount,
                    sub_total: totals.subTotal,
                    grand_total: totals.grandTotal,
                    terms,
                    notes,
                    ops_status: taskToEdit?.meta_data?.ops_status || 'Quoted'
                }
            };

            if (taskToEdit?.id) {
                const { error } = await supabase
                    .from("tasks")
                    .update(quotationData)
                    .eq("id", taskToEdit.id);
                if (error) throw error;
            } else {
                quotationData.created_by = user?.id;
                const { error } = await supabase
                    .from("tasks")
                    .insert(quotationData);
                if (error) throw error;
            }

            onSuccess?.();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error saving quotation:", err);
            alert("Failed to save quotation.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl tracking-tight">
                        <FileText className="text-pink-500" size={24} />
                        {taskToEdit ? "Edit Quotation" : "Create New Quotation"}
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Fill in the fulfillment and pricing details for this quotation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 py-4">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                                <User size={12} /> Client Name
                            </label>
                            <input
                                value={clientName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full px-3 py-2 bg-discord-dark border border-white/5 rounded text-sm text-discord-text focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={12} /> Company Name
                            </label>
                            <input
                                value={companyName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                                placeholder="e.g. Acme Corp"
                                className="w-full px-3 py-2 bg-discord-dark border border-white/5 rounded text-sm text-discord-text focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} /> Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                                className="w-full px-3 py-2 bg-discord-dark border border-white/5 rounded text-sm text-discord-text focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-discord-text uppercase tracking-wider flex items-center gap-2">
                                <Plus size={16} className="text-pink-500" /> Items & Pricing
                            </h3>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={addItem}
                                className="bg-discord-dark border-white/5 hover:bg-discord-item text-xs"
                            >
                                <Plus size={14} className="mr-1" /> Add Item
                            </Button>
                        </div>

                        <div className="bg-discord-dark/50 rounded-lg border border-white/5 overflow-hidden">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-discord-dark text-discord-text-muted uppercase font-black">
                                    <tr>
                                        <th className="px-4 py-2">Item Name</th>
                                        <th className="px-4 py-2 w-24">Qty</th>
                                        <th className="px-4 py-2 w-32">Price (EGP)</th>
                                        <th className="px-4 py-2 w-32">Total</th>
                                        <th className="px-4 py-2 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="px-2 py-2">
                                                <input
                                                    value={item.name}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-discord-text px-2"
                                                    placeholder="Item description..."
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-center text-discord-text p-0"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-right text-discord-text p-0"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-discord-text">
                                                {(item.qty * item.price).toLocaleString()} EGP
                                            </td>
                                            <td className="px-2 py-2">
                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="p-1.5 text-discord-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-discord-text-muted uppercase tracking-widest flex items-center gap-2">
                                    VAT (%)
                                </label>
                                <input
                                    type="number"
                                    value={taxRate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRate(parseFloat(e.target.value) || 0)}
                                    className="w-24 px-3 py-2 bg-discord-dark border border-white/5 rounded text-sm text-discord-text focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                />
                            </div>
                        </div>

                        <div className="bg-discord-dark/30 p-6 rounded-xl border border-white/5 space-y-3">
                            <div className="flex justify-between text-discord-text-muted text-xs">
                                <span>Subtotal</span>
                                <span className="font-mono">{totals.subTotal.toLocaleString()} EGP</span>
                            </div>
                            <div className="flex justify-between text-discord-text-muted text-xs">
                                <span>VAT ({taxRate}%)</span>
                                <span className="font-mono text-orange-400">+{totals.taxAmount.toLocaleString()} EGP</span>
                            </div>
                            <div className="h-px bg-white/5 my-2" />
                            <div className="flex justify-between text-lg font-black text-discord-text">
                                <span>Total Amount</span>
                                <span className="text-emerald-400 font-mono tracking-tighter">
                                    {totals.grandTotal.toLocaleString()} EGP
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Terms Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-discord-text-muted uppercase tracking-widest">General Terms</h3>
                                <button
                                    onClick={() => addListEntry(setTerms, terms)}
                                    className="text-pink-500 hover:text-pink-400 text-xs flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {terms.map((term, idx) => (
                                    <div key={idx} className="flex gap-2 group">
                                        <input
                                            value={term}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateListEntry(setTerms, terms, idx, e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-discord-dark border border-white/5 rounded text-xs text-discord-text focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                            placeholder="Enter term..."
                                        />
                                        <button
                                            onClick={() => removeListEntry(setTerms, terms, idx)}
                                            className="p-1.5 text-discord-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-discord-text-muted uppercase tracking-widest">Internal Notes</h3>
                                <button
                                    onClick={() => addListEntry(setNotes, notes)}
                                    className="text-pink-500 hover:text-pink-400 text-xs flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {notes.map((note, idx) => (
                                    <div key={idx} className="flex gap-2 group">
                                        <input
                                            value={note}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateListEntry(setNotes, notes, idx, e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-discord-dark border border-white/5 rounded text-xs text-discord-text focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                            placeholder="Enter note..."
                                        />
                                        <button
                                            onClick={() => removeListEntry(setNotes, notes, idx)}
                                            className="p-1.5 text-discord-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-white/5 pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-discord-text-muted hover:text-discord-text hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-8 font-bold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Quotation"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
