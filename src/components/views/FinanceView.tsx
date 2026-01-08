"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Calculator, Package, TrendingUp, TrendingDown, Search, Image as ImageIcon, Pencil, Trash2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddFinanceDialog from "@/components/AddFinanceDialog";
import InventoryMovementDialog from "@/components/InventoryMovementDialog";
import InventoryHistoryDialog from "@/components/InventoryHistoryDialog";

interface FinanceRecord {
    id: string;
    date: string;
    invoice_number: string;
    supplier_name: string;
    tax_reg_number?: string;
    amount_base: number;
    amount_vat: number;
    amount_total: number;
    description: string;
    type: 'payment' | 'sale';
    created_at: string;
}

interface InventoryRecord {
    id: string;
    date: string;
    item_code: string;
    item_name: string;
    in_go: number;
    out_go: number;
    balance: number;
    reference_number: string;
    image_url: string | null;
    created_at: string;
}

interface FinanceViewProps {
    filter: 'payments' | 'sales' | 'inventory';
}

export default function FinanceView({ filter }: FinanceViewProps) {
    const [financeData, setFinanceData] = useState<FinanceRecord[]>([]);
    const [inventoryData, setInventoryData] = useState<InventoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [movementDialogOpen, setMovementDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            if (filter === 'inventory') {
                const { data, error: fetchError } = await supabase
                    .from("inventory")
                    .select("*")
                    .order("date", { ascending: false });
                if (fetchError) throw fetchError;
                setInventoryData(data || []);
            } else {
                const type = filter === 'payments' ? 'payment' : 'sale';
                const { data, error: fetchError } = await supabase
                    .from("finance")
                    .select("*")
                    .eq("type", type)
                    .order("date", { ascending: false });
                if (fetchError) throw fetchError;
                setFinanceData(data || []);
            }
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleDataAdded = () => {
        fetchData();
        setEditingItem(null);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setAddDialogOpen(true);
    };

    const handleDelete = async (id: string, table: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        const supabase = createClient();
        const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("Error deleting entry:", deleteError);
            alert("Failed to delete entry.");
        } else {
            fetchData();
        }
    };

    const totalAmount = financeData.reduce((sum, item) => sum + item.amount_total, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-discord-blurple" size={32} />
            </div>
        );
    }

    const filteredFinance = financeData.filter(item =>
        item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredInventory = inventoryData.filter(item =>
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-discord-text capitalize">
                        {filter} Board
                    </h1>
                    <p className="text-discord-text-muted text-sm">
                        {filter === 'inventory' ? 'Manage stock and warehouse movements.' : `Track all ${filter} and invoices.`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-discord-dark border-none rounded-lg pl-9 pr-4 py-2 text-sm text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none w-64"
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setEditingItem(null);
                            setAddDialogOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Entry
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 mb-6 font-medium">
                    {error}
                </div>
            )}

            {/* Content */}
            {filter === 'inventory' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredInventory.map((item) => (
                        <div key={item.id} className="bg-discord-sidebar rounded-xl overflow-hidden border border-white/5 hover:border-discord-blurple/50 transition-all group flex flex-col">
                            <div className="aspect-square bg-discord-dark flex items-center justify-center overflow-hidden relative">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                ) : (
                                    <ImageIcon size={48} className="text-discord-text-muted/20" />
                                )}
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                    <div className="bg-discord-dark/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-discord-text-muted">
                                        {item.item_code}
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 bg-discord-blurple rounded-full text-white hover:scale-110 transition-transform"
                                        title="Edit"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id, 'inventory')}
                                        className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-discord-text truncate mb-1">{item.item_name}</h3>
                                <p className="text-xs text-discord-text-muted mb-3 flex items-center gap-1">
                                    Ref: {item.reference_number || 'N/A'}
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-discord-dark rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-discord-text-muted uppercase font-bold">In</p>
                                        <p className="text-sm font-bold text-green-400">{item.in_go}</p>
                                    </div>
                                    <div className="bg-discord-dark rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-discord-text-muted uppercase font-bold">Out</p>
                                        <p className="text-sm font-bold text-red-400">{item.out_go}</p>
                                    </div>
                                    <div className="bg-discord-dark rounded-lg p-2 text-center border border-discord-blurple/30">
                                        <p className="text-[10px] text-discord-blurple uppercase font-bold">Bal</p>
                                        <p className="text-sm font-bold text-discord-text">{item.balance}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedInventoryItem(item);
                                            setMovementDialogOpen(true);
                                        }}
                                        className="flex-1 bg-discord-blurple/10 border-discord-blurple/30 hover:bg-discord-blurple text-discord-text text-[11px] h-8"
                                    >
                                        <ArrowUpRight size={14} className="mr-1" />
                                        Move
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedInventoryItem(item);
                                            setHistoryDialogOpen(true);
                                        }}
                                        className="flex-1 bg-discord-dark border-white/5 hover:bg-discord-sidebar text-discord-text-muted hover:text-discord-text text-[11px] h-8"
                                    >
                                        History
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredInventory.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-discord-sidebar rounded-xl border-2 border-dashed border-white/5">
                            <Package size={48} className="mx-auto text-discord-text-muted/20 mb-3" />
                            <p className="text-discord-text-muted">No inventory records found.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-discord-sidebar rounded-xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-discord-text-muted text-xs uppercase font-bold tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Supplier/Client</th>
                                    <th className="px-6 py-4">Base Amount</th>
                                    <th className="px-6 py-4">VAT</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredFinance.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-sm text-discord-text">
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono bg-discord-dark px-2 py-1 rounded text-discord-text-muted">
                                                {item.invoice_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-discord-text">
                                            {item.supplier_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-discord-text-muted">
                                            ${item.amount_base.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-orange-400">
                                            ${item.amount_vat.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-emerald-400">
                                                ${item.amount_total.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-discord-text-muted truncate max-w-[200px]">
                                            {item.description}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 text-discord-text-muted hover:text-discord-blurple hover:bg-discord-blurple/10 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, 'finance')}
                                                    className="p-1.5 text-discord-text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredFinance.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <Calculator size={48} className="mx-auto text-discord-text-muted/20 mb-3" />
                                            <p className="text-discord-text-muted">No {filter} records found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {filteredFinance.length > 0 && (
                                <tfoot>
                                    <tr className="bg-black/30 font-bold">
                                        <td colSpan={5} className="px-6 py-4 text-right text-discord-text-muted uppercase text-xs tracking-widest">
                                            Total {filter}
                                        </td>
                                        <td className="px-6 py-4 text-emerald-400 text-lg">
                                            ${totalAmount.toLocaleString()}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            <AddFinanceDialog
                open={addDialogOpen}
                onOpenChange={(open) => {
                    setAddDialogOpen(open);
                    if (!open) setEditingItem(null);
                }}
                filter={filter}
                editingItem={editingItem}
                onSuccess={handleDataAdded}
            />

            <InventoryMovementDialog
                open={movementDialogOpen}
                onOpenChange={setMovementDialogOpen}
                inventoryItem={selectedInventoryItem}
                onSuccess={fetchData}
            />

            <InventoryHistoryDialog
                open={historyDialogOpen}
                onOpenChange={setHistoryDialogOpen}
                inventoryItem={selectedInventoryItem}
            />
        </div>
    );
}
