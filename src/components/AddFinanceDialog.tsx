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
import { Loader2, Save, X, Plus, Calculator, Package, Upload, Image as ImageIcon, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface AddFinanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filter: 'payments' | 'sales' | 'inventory';
    onSuccess: () => void;
    editingItem?: any;
}

export default function AddFinanceDialog({
    open,
    onOpenChange,
    filter,
    onSuccess,
    editingItem,
}: AddFinanceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Finance State
    const [financeForm, setFinanceForm] = useState({
        date: new Date().toISOString().split('T')[0],
        invoice_number: "",
        supplier_name: "",
        tax_reg_number: "",
        description: "",
        amount_base: 0,
        amount_vat: 0,
        payment_status: "Pending" as "Pending" | "Paid" | "Overdue" | "Cancelled",
        items: [] as { name: string, qty: number, price: number }[],
    });

    const [newItem, setNewItem] = useState({ name: '', qty: 1, price: 0 });

    // Inventory State
    const [inventoryForm, setInventoryForm] = useState({
        date: new Date().toISOString().split('T')[0],
        item_code: "",
        item_name: "",
        in_go: 0,
        out_go: 0,
        balance: 0,
        reference_number: "",
        image_url: null as string | null,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const isInventory = filter === 'inventory';

    const subtotal = financeForm.items?.reduce((sum, item) => sum + (item.qty * item.price), 0) || financeForm.amount_base || 0;
    const amountTotal = subtotal + financeForm.amount_vat;

    useEffect(() => {
        if (open) {
            setError(null);
            if (editingItem) {
                if (isInventory) {
                    setInventoryForm({
                        date: editingItem.date || new Date().toISOString().split('T')[0],
                        item_code: editingItem.item_code || "",
                        item_name: editingItem.item_name || "",
                        in_go: editingItem.in_go || 0,
                        out_go: editingItem.out_go || 0,
                        balance: editingItem.balance || 0,
                        reference_number: editingItem.reference_number || "",
                        image_url: editingItem.image_url || null,
                    });
                    setImagePreview(editingItem.image_url || null);
                    setImageFile(null);
                } else {
                    setFinanceForm({
                        date: editingItem.date || new Date().toISOString().split('T')[0],
                        invoice_number: editingItem.invoice_number || "",
                        supplier_name: editingItem.supplier_name || "",
                        tax_reg_number: editingItem.tax_reg_number || "",
                        description: editingItem.description || "",
                        amount_base: editingItem.amount_base || 0,
                        amount_vat: editingItem.amount_vat || 0,
                        payment_status: editingItem.payment_status || "Pending",
                        items: editingItem.items || [],
                    });
                }
            } else {
                if (isInventory) {
                    setInventoryForm({
                        date: new Date().toISOString().split('T')[0],
                        item_code: "",
                        item_name: "",
                        in_go: 0,
                        out_go: 0,
                        balance: 0,
                        reference_number: "",
                        image_url: null,
                    });
                    setImageFile(null);
                    setImagePreview(null);
                } else {
                    setFinanceForm({
                        date: new Date().toISOString().split('T')[0],
                        invoice_number: "",
                        supplier_name: "",
                        tax_reg_number: "",
                        description: "",
                        amount_base: 0,
                        amount_vat: 0,
                        payment_status: "Pending",
                        items: [],
                    });
                }
            }
        }
    }, [open, isInventory, editingItem]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();

        try {
            if (isInventory) {
                let imageUrl = null;
                if (imageFile) {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError, data } = await supabase.storage
                        .from('inventory-images')
                        .upload(filePath, imageFile);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('inventory-images')
                        .getPublicUrl(filePath);

                    imageUrl = publicUrl;
                }

                if (editingItem) {
                    const { error: updateError } = await supabase
                        .from("inventory")
                        .update({
                            ...inventoryForm,
                            image_url: imageUrl || inventoryForm.image_url,
                            in_go: Number(inventoryForm.in_go),
                            out_go: Number(inventoryForm.out_go),
                            balance: Number(inventoryForm.balance)
                        })
                        .eq('id', editingItem.id);
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from("inventory")
                        .insert({
                            ...inventoryForm,
                            image_url: imageUrl,
                            in_go: Number(inventoryForm.in_go),
                            out_go: Number(inventoryForm.out_go),
                            balance: Number(inventoryForm.balance)
                        });
                    if (insertError) throw insertError;
                }
            } else {
                if (editingItem) {
                    const { error: updateError } = await supabase
                        .from("finance")
                        .update({
                            ...financeForm,
                            amount_base: Number(subtotal),
                            amount_vat: Number(financeForm.amount_vat),
                            amount_total: Number(amountTotal),
                            type: filter === 'payments' ? 'payment' : 'sale',
                            payment_status: financeForm.payment_status,
                            items: financeForm.items
                        })
                        .eq('id', editingItem.id);
                    if (updateError) throw updateError;
                } else {
                    const { data: newFinance, error: insertError } = await supabase
                        .from("finance")
                        .insert({
                            ...financeForm,
                            amount_base: Number(subtotal),
                            amount_vat: Number(financeForm.amount_vat),
                            amount_total: Number(amountTotal),
                            type: filter === 'payments' ? 'payment' : 'sale',
                            payment_status: financeForm.payment_status,
                            items: financeForm.items
                        })
                        .select()
                        .single();
                    if (insertError) throw insertError;

                    // Automatically link to Treasury
                    if (newFinance) {
                        const { error: treasuryError } = await supabase
                            .from("treasury")
                            .insert({
                                finance_id: newFinance.id,
                                type: filter === 'sales' ? 'collection' : 'payment',
                                date: financeForm.date,
                                invoice_number: financeForm.invoice_number,
                                client_name: financeForm.supplier_name,
                                amount: Number(subtotal),
                                tax: Number(financeForm.amount_vat),
                                total: Number(amountTotal),
                                status: 'Pending',
                                transaction_method: null,
                                deduction_profit: 0
                            });
                        if (treasuryError) throw treasuryError;
                    }
                }
            }

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error saving entry:", err);
            setError(err.message || "Failed to save entry.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl capitalize">
                        {isInventory ? <Package className="text-emerald-500" /> : <Calculator className="text-emerald-500" />}
                        {editingItem ? 'Edit' : 'Add New'} {filter.slice(0, -1)} Entry
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        {editingItem ? 'Update the details for this' : 'Enter the details for the new'} {filter.slice(0, -1)} record.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Common: Date */}
                        <div className="space-y-2 flex flex-col">
                            <label className="text-xs font-bold text-discord-text-muted uppercase">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-discord-dark border-none text-discord-text hover:bg-discord-item h-[48px]",
                                            !(isInventory ? inventoryForm.date : financeForm.date) && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {(isInventory ? inventoryForm.date : financeForm.date) ? (
                                            format(new Date(isInventory ? inventoryForm.date : financeForm.date), "dd-MM-yyyy")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-discord-sidebar border-discord-dark" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={(isInventory ? inventoryForm.date : financeForm.date) ? new Date(isInventory ? inventoryForm.date : financeForm.date) : undefined}
                                        onSelect={(d) => {
                                            const val = d ? d.toISOString() : '';
                                            if (isInventory) {
                                                setInventoryForm({ ...inventoryForm, date: val });
                                            } else {
                                                setFinanceForm({ ...financeForm, date: val });
                                            }
                                        }}
                                        initialFocus
                                        className="bg-discord-sidebar text-discord-text"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {isInventory ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Item Code</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="STK-001"
                                        value={inventoryForm.item_code}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, item_code: e.target.value })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Item Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Product Name"
                                        value={inventoryForm.item_name}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, item_name: e.target.value })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase text-green-400">In-Go (Amount)</label>
                                    <input
                                        type="number"
                                        value={inventoryForm.in_go}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, in_go: Number(e.target.value) })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase text-red-400">Out-Go (Amount)</label>
                                    <input
                                        type="number"
                                        value={inventoryForm.out_go}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, out_go: Number(e.target.value) })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Current Balance</label>
                                    <input
                                        required
                                        type="number"
                                        value={inventoryForm.balance}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, balance: Number(e.target.value) })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">
                                        {inventoryForm.in_go > 0 ? "In-Go Invoice Number" : inventoryForm.out_go > 0 ? "Out-Go Event Name" : "Reference"}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={inventoryForm.in_go > 0 ? "INV-12345" : "Project X Release"}
                                        value={inventoryForm.reference_number}
                                        onChange={(e) => setInventoryForm({ ...inventoryForm, reference_number: e.target.value })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Upload Image</label>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-24 h-24 bg-discord-dark rounded-lg flex items-center justify-center border-2 border-dashed border-white/10 overflow-hidden relative"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-discord-text-muted/30" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                <Upload size={20} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                            <p className="text-xs text-discord-text-muted">Click the box to upload a product image. (Optional)</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Invoice #</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="INV-XXXX"
                                        value={financeForm.invoice_number}
                                        onChange={(e) => setFinanceForm({ ...financeForm, invoice_number: e.target.value })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Supplier / Client Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Company Co."
                                        value={financeForm.supplier_name}
                                        onChange={(e) => setFinanceForm({ ...financeForm, supplier_name: e.target.value })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Tax Reg #</label>
                                    <input
                                        type="text"
                                        placeholder="123-456-789"
                                        value={financeForm.tax_reg_number}
                                        onChange={(e) => setFinanceForm({ ...financeForm, tax_reg_number: e.target.value })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                    />
                                </div>
                                {filter === 'payments' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-discord-text-muted uppercase">Payment Status</label>
                                        <select
                                            value={financeForm.payment_status}
                                            onChange={(e) => setFinanceForm({ ...financeForm, payment_status: e.target.value as any })}
                                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Overdue">Overdue</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                ) : filter === 'sales' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-discord-text-muted uppercase">Collection Status</label>
                                        <select
                                            value={financeForm.payment_status}
                                            onChange={(e) => setFinanceForm({ ...financeForm, payment_status: e.target.value as any })}
                                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Paid">Collected</option>
                                        </select>
                                    </div>
                                ) : null}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Description</label>
                                    <textarea
                                        required
                                        rows={2}
                                        placeholder="Service or product details..."
                                        value={financeForm.description}
                                        onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none resize-none"
                                    />
                                </div>

                                {/* Items Section */}
                                <div className="space-y-4 md:col-span-2 border-t border-white/5 pt-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-discord-text-muted uppercase">Items List</label>
                                        <span className="text-xs text-discord-text-muted">{financeForm.items.length} Items</span>
                                    </div>

                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-6">
                                            <input
                                                type="text"
                                                placeholder="Item Name"
                                                value={newItem.name}
                                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                className="w-full bg-discord-dark border-none rounded-lg p-2 text-sm text-discord-text outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={newItem.qty}
                                                onChange={(e) => setNewItem({ ...newItem, qty: Number(e.target.value) })}
                                                className="w-full bg-discord-dark border-none rounded-lg p-2 text-sm text-discord-text outline-none"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={newItem.price}
                                                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                                className="w-full bg-discord-dark border-none rounded-lg p-2 text-sm text-discord-text outline-none"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (newItem.name && newItem.qty > 0) {
                                                        setFinanceForm({
                                                            ...financeForm,
                                                            items: [...financeForm.items, newItem]
                                                        });
                                                        setNewItem({ name: '', qty: 1, price: 0 });
                                                    }
                                                }}
                                                className="w-full h-full bg-discord-blurple hover:bg-discord-blurple-hover p-0"
                                            >
                                                <Plus size={18} />
                                            </Button>
                                        </div>
                                    </div>

                                    {financeForm.items.length > 0 && (
                                        <div className="mt-4 rounded-lg overflow-hidden border border-white/5">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-discord-dark text-discord-text-muted text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2">Item</th>
                                                        <th className="px-4 py-2">Qty</th>
                                                        <th className="px-4 py-2">Price</th>
                                                        <th className="px-4 py-2 text-right">Total</th>
                                                        <th className="px-4 py-2 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {financeForm.items.map((item, index) => (
                                                        <tr key={index} className="bg-discord-dark/50">
                                                            <td className="px-4 py-2">{item.name}</td>
                                                            <td className="px-4 py-2">{item.qty}</td>
                                                            <td className="px-4 py-2">{item.price.toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right">{(item.qty * item.price).toLocaleString()}</td>
                                                            <td className="px-4 py-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newItems = [...financeForm.items];
                                                                        newItems.splice(index, 1);
                                                                        setFinanceForm({ ...financeForm, items: newItems });
                                                                    }}
                                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase">Subtotal (EGP)</label>
                                    <div className="w-full bg-discord-dark/50 border border-white/5 rounded-lg p-3 text-discord-text">
                                        {subtotal.toLocaleString()}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-discord-text-muted uppercase text-orange-400">VAT (Amount) (EGP)</label>
                                    <input
                                        required
                                        type="number"
                                        value={financeForm.amount_vat}
                                        onChange={(e) => setFinanceForm({ ...financeForm, amount_vat: Number(e.target.value) })}
                                        className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex justify-between items-center">
                                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-2xl font-bold text-emerald-400">{amountTotal.toLocaleString()} EGP</span>
                                </div>
                            </>
                        )}
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Entry
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
