"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus, Calculator, Package, TrendingUp, TrendingDown, Search, Image as ImageIcon, Pencil, Trash2, ArrowUpRight, Calendar, User, Filter, ArrowUp, ArrowDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddFinanceDialog from "@/components/AddFinanceDialog";
import InventoryMovementDialog from "@/components/InventoryMovementDialog";
import InventoryHistoryDialog from "@/components/InventoryHistoryDialog";
import FinanceDetailDialog from "@/components/FinanceDetailDialog";
import { Eye } from "lucide-react";

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
    payment_status?: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
    items?: any[];
    created_at: string;
    created_by?: string;
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
    const [detailItem, setDetailItem] = useState<any>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Advanced Filtering States
    const [dateFilter, setDateFilter] = useState<{ mode: 'all' | 'day' | 'week' | 'month' | 'year', value: string }>({
        mode: 'all',
        value: new Date().toISOString().split('T')[0]
    });
    const [userFilter, setUserFilter] = useState<string>("");
    const [amountSort, setAmountSort] = useState<'asc' | 'desc' | 'none'>('none');
    const [amountFilter, setAmountFilter] = useState<{ operator: 'none' | 'lt' | 'gt' | 'eq', value: number }>({
        operator: 'none',
        value: 0
    });
    const [vatFilter, setVatFilter] = useState<'all' | 'with_vat' | 'no_vat'>('all');

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

    useEffect(() => {
        fetchData();
    }, [filter]);

    // Finance Processing Logic
    const processedFinanceData = useMemo(() => {
        // Safety check: if not viewing finance, just return empty array
        if (filter === 'inventory') return [];

        return financeData
            .filter(item => {
                // Search term (Supplier/Client, Invoice, Description)
                if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    const matchesSearch =
                        item.supplier_name?.toLowerCase().includes(search) ||
                        item.invoice_number?.toLowerCase().includes(search) ||
                        item.description?.toLowerCase().includes(search);
                    if (!matchesSearch) return false;
                }

                // VAT Filter
                if (vatFilter === 'with_vat' && (!item.amount_vat || item.amount_vat === 0)) return false;
                if (vatFilter === 'no_vat' && item.amount_vat > 0) return false;

                // Amount Threshold Filter
                if (amountFilter.operator !== 'none') {
                    if (amountFilter.operator === 'lt' && item.amount_base >= amountFilter.value) return false;
                    if (amountFilter.operator === 'gt' && item.amount_base <= amountFilter.value) return false;
                    if (amountFilter.operator === 'eq' && item.amount_base !== amountFilter.value) return false;
                }

                // Date Filter (Day, Week, Month, Year logic)
                if (dateFilter.mode !== 'all') {
                    const itemDate = new Date(item.date);
                    const filterDate = new Date(dateFilter.value);

                    if (dateFilter.mode === 'day') {
                        if (itemDate.toDateString() !== filterDate.toDateString()) return false;
                    } else if (dateFilter.mode === 'month') {
                        if (itemDate.getMonth() !== filterDate.getMonth() || itemDate.getFullYear() !== filterDate.getFullYear()) return false;
                    } else if (dateFilter.mode === 'year') {
                        if (itemDate.getFullYear() !== filterDate.getFullYear()) return false;
                    } else if (dateFilter.mode === 'week') {
                        // Week logic: compare start of week
                        const getStartOfWeek = (d: Date) => {
                            const date = new Date(d);
                            const day = date.getDay();
                            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                            return new Date(date.setDate(diff)).toDateString();
                        };
                        if (getStartOfWeek(itemDate) !== getStartOfWeek(filterDate)) return false;
                    }
                }

                // User Filter
                if (userFilter && item.created_by !== userFilter) return false;

                return true;
            })
            .sort((a, b) => {
                // Amount Sorting
                if (amountSort === 'asc') return a.amount_base - b.amount_base;
                if (amountSort === 'desc') return b.amount_base - a.amount_base;
                // Default to newest date
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [financeData, searchTerm, dateFilter, userFilter, amountSort, amountFilter, vatFilter, filter]);

    // Unique Users for filter dropdown
    const uniqueUsers = useMemo(() => {
        const users = new Set<string>();
        financeData.forEach(item => {
            if (item.created_by) users.add(item.created_by);
        });
        return Array.from(users);
    }, [financeData]);

    const filteredInventory = useMemo(() => {
        if (filter !== 'inventory') return [];
        return inventoryData.filter(item =>
            item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inventoryData, searchTerm, filter]);

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

    const totalAmountValue = processedFinanceData.reduce((sum, item) => sum + item.amount_total, 0);

    const statusColors: Record<string, string> = {
        Paid: "text-emerald-400 bg-emerald-400/10",
        Pending: "text-yellow-400 bg-yellow-400/10",
        Overdue: "text-red-400 bg-red-400/10",
        Cancelled: "text-discord-text-muted bg-discord-dark/50"
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-discord-blurple" size={32} />
            </div>
        );
    }

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

            {/* Filter Toolbar */}
            {filter !== 'inventory' && (
                <div className="bg-discord-sidebar/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-6">
                        {/* Date Filter */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-discord-text-muted">
                                <Calendar size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                            </div>
                            <div className="flex bg-discord-dark rounded-lg p-1">
                                {(['all', 'day', 'week', 'month', 'year'] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setDateFilter({ ...dateFilter, mode: m })}
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${dateFilter.mode === m ? 'bg-discord-blurple text-white shadow-lg' : 'text-discord-text-muted hover:text-discord-text'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            {dateFilter.mode !== 'all' && (
                                <input
                                    type="date"
                                    value={dateFilter.value}
                                    onChange={(e) => setDateFilter({ ...dateFilter, value: e.target.value })}
                                    className="bg-discord-dark border-none rounded-lg px-3 py-1.5 text-xs text-discord-text focus:ring-1 focus:ring-discord-blurple outline-none"
                                />
                            )}
                        </div>

                        {/* User Filter */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-discord-text-muted">
                                <User size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Created By</span>
                            </div>
                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="bg-discord-dark border-none rounded-lg px-3 py-1.5 text-xs text-discord-text focus:ring-1 focus:ring-discord-blurple outline-none cursor-pointer min-w-[120px]"
                            >
                                <option value="">All Users</option>
                                {uniqueUsers.map(uid => (
                                    <option key={uid} value={uid}>{uid.slice(0, 8)}...</option>
                                ))}
                            </select>
                        </div>

                        {/* VAT Filter */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-discord-text-muted">
                                <Filter size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">VAT</span>
                            </div>
                            <select
                                value={vatFilter}
                                onChange={(e) => setVatFilter(e.target.value as any)}
                                className="bg-discord-dark border-none rounded-lg px-3 py-1.5 text-xs text-discord-text focus:ring-1 focus:ring-discord-blurple outline-none cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="with_vat">With VAT</option>
                                <option value="no_vat">No VAT</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/5">
                        {/* Amount Filter */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-discord-text-muted">
                                <Calculator size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Amount</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={amountFilter.operator}
                                    onChange={(e) => setAmountFilter({ ...amountFilter, operator: e.target.value as any })}
                                    className="bg-discord-dark border-none rounded-lg px-2 py-1.5 text-xs text-discord-text focus:ring-1 focus:ring-discord-blurple outline-none cursor-pointer"
                                >
                                    <option value="none">Any</option>
                                    <option value="lt">Less than (&lt;)</option>
                                    <option value="gt">Greater than (&gt;)</option>
                                    <option value="eq">Equal to (=)</option>
                                </select>
                                {amountFilter.operator !== 'none' && (
                                    <input
                                        type="number"
                                        placeholder="Value..."
                                        value={amountFilter.value || ""}
                                        onChange={(e) => setAmountFilter({ ...amountFilter, value: Number(e.target.value) })}
                                        className="bg-discord-dark border-none rounded-lg px-3 py-1.5 text-xs text-discord-text focus:ring-1 focus:ring-discord-blurple outline-none w-24"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Sorting */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-discord-text-muted">
                                {amountSort === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                                <span className="text-xs font-bold uppercase tracking-wider">Sort Amount</span>
                            </div>
                            <button
                                onClick={() => setAmountSort(amountSort === 'asc' ? 'desc' : amountSort === 'desc' ? 'none' : 'asc')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${amountSort !== 'none' ? 'bg-discord-blurple text-white shadow-lg' : 'bg-discord-dark text-discord-text-muted hover:text-discord-text'
                                    }`}
                            >
                                {amountSort === 'none' ? 'None' : amountSort === 'asc' ? 'Low → High' : 'High → Low'}
                            </button>
                        </div>

                        {/* Clear Filters */}
                        <button
                            onClick={() => {
                                setDateFilter({ mode: 'all', value: new Date().toISOString().split('T')[0] });
                                setUserFilter("");
                                setVatFilter("all");
                                setAmountFilter({ operator: 'none', value: 0 });
                                setAmountSort("none");
                                setSearchTerm("");
                            }}
                            className="ml-auto text-xs text-discord-text-muted hover:text-red-400 transition-colors flex items-center gap-1 font-bold uppercase"
                        >
                            <X size={14} />
                            Reset All
                        </button>
                    </div>
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
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Base Amount</th>
                                    <th className="px-6 py-4">VAT</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4 text-center">Details</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {processedFinanceData.map((item) => (
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
                                            <div className="flex flex-col">
                                                <span>{item.supplier_name}</span>
                                                <span className="text-[10px] text-discord-text-muted truncate max-w-[150px] font-normal">
                                                    {item.description}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[item.payment_status || 'Pending']}`}>
                                                {item.payment_status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-discord-text-muted">
                                            {item.amount_base.toLocaleString()} EGP
                                        </td>
                                        <td className="px-6 py-4 text-sm text-orange-400">
                                            {item.amount_vat.toLocaleString()} EGP
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-emerald-400">
                                                {item.amount_total.toLocaleString()} EGP
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setDetailItem(item);
                                                    setDetailDialogOpen(true);
                                                }}
                                                className="p-1.5 text-discord-text-muted hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
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
                                {processedFinanceData.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <Calculator size={48} className="mx-auto text-discord-text-muted/20 mb-3" />
                                            <p className="text-discord-text-muted">No {filter} records found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {processedFinanceData.length > 0 && (
                                <tfoot>
                                    <tr className="bg-black/30 font-bold">
                                        <td colSpan={7} className="px-6 py-4 text-right text-discord-text-muted uppercase text-xs tracking-widest">
                                            Total {filter}
                                        </td>
                                        <td className="px-6 py-4 text-emerald-400 text-lg">
                                            {totalAmountValue.toLocaleString()} EGP
                                        </td>
                                        <td colSpan={1}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            <FinanceDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                record={detailItem}
            />

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
