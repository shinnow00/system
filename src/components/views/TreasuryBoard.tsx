'use client';

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    Landmark,
    Search,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    ArrowUpDown,
    Loader2,
    Calendar,
    Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CompleteTransactionDialog from "@/components/CompleteTransactionDialog";

interface TreasuryRecord {
    id: string;
    finance_id: string;
    type: 'collection' | 'payment';
    date: string;
    invoice_number: string;
    client_name: string;
    amount: number;
    tax: number;
    total: number;
    status: 'Pending' | 'Completed';
    transaction_method: string | null;
    deduction_profit: number;
    notes: string | null;
    created_at: string;
}

interface FinancialSummary {
    total_collections: number;
    total_payments: number;
    net_balance: number;
    pending_collections: number;
    pending_payments: number;
}

export default function TreasuryBoard() {
    const [treasuryData, setTreasuryData] = useState<TreasuryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'collection' | 'payment'>('collection');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTransaction, setSelectedTransaction] = useState<TreasuryRecord | null>(null);
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("treasury")
                .select("*")
                .order("date", { ascending: false });

            if (error) throw error;
            setTreasuryData(data || []);
        } catch (err) {
            console.error("Error fetching treasury data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const summary = useMemo(() => {
        return treasuryData.reduce((acc, curr) => {
            const amount = curr.total || 0;
            if (curr.type === 'collection') {
                if (curr.status === 'Completed') acc.total_collections += amount;
                else acc.pending_collections += amount;
            } else {
                if (curr.status === 'Completed') acc.total_payments += amount;
                else acc.pending_payments += amount;
            }
            return acc;
        }, {
            total_collections: 0,
            total_payments: 0,
            net_balance: 0,
            pending_collections: 0,
            pending_payments: 0
        });
    }, [treasuryData]);

    const netBalance = summary.total_collections - summary.total_payments;

    const filteredAndSortedData = useMemo(() => {
        return treasuryData
            .filter(item => {
                if (item.type !== activeTab) return false;
                if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    return (
                        item.client_name?.toLowerCase().includes(search) ||
                        item.invoice_number?.toLowerCase().includes(search)
                    );
                }
                return true;
            })
            .sort((a, b) => {
                // Pending first
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                // Then newest date
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [treasuryData, activeTab, searchTerm]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-discord-blurple" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-discord-sidebar/50 backdrop-blur-sm border border-emerald-500/20 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-emerald-500/10 p-3 rounded-xl">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded">
                            Collections
                        </span>
                    </div>
                    <h3 className="text-discord-text-muted text-sm font-medium mb-1">Total Collected</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-white">{summary.total_collections.toLocaleString()}</span>
                        <span className="text-xs font-medium text-discord-text-muted">EGP</span>
                    </div>
                    <p className="text-xs text-yellow-400 font-medium">
                        {summary.pending_collections.toLocaleString()} EGP Pending
                    </p>
                </div>

                <div className="bg-discord-sidebar/50 backdrop-blur-sm border border-red-500/20 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-red-500/10 p-3 rounded-xl">
                            <TrendingDown className="text-red-400" size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/5 px-2 py-1 rounded">
                            Payments
                        </span>
                    </div>
                    <h3 className="text-discord-text-muted text-sm font-medium mb-1">Total Paid</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-white">{summary.total_payments.toLocaleString()}</span>
                        <span className="text-xs font-medium text-discord-text-muted">EGP</span>
                    </div>
                    <p className="text-xs text-red-300/50">
                        {summary.pending_payments.toLocaleString()} EGP Pending
                    </p>
                </div>

                <div className="bg-discord-sidebar/50 backdrop-blur-sm border border-discord-blurple/20 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-discord-blurple/10 p-3 rounded-xl">
                            <Wallet className="text-discord-blurple" size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-discord-blurple uppercase tracking-widest bg-discord-blurple/5 px-2 py-1 rounded">
                            Treasury
                        </span>
                    </div>
                    <h3 className="text-discord-text-muted text-sm font-medium mb-1">Net Balance</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-white">{netBalance.toLocaleString()}</span>
                        <span className="text-xs font-medium text-discord-text-muted">EGP</span>
                    </div>
                    <p className="text-xs text-discord-text-muted">Actual liquid capital</p>
                </div>
            </div>

            {/* Toolbar & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-discord-dark p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('collection')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'collection'
                                ? "bg-discord-sidebar text-white shadow-lg border border-white/5"
                                : "text-discord-text-muted hover:text-discord-text"
                            }`}
                    >
                        Collections
                    </button>
                    <button
                        onClick={() => setActiveTab('payment')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'payment'
                                ? "bg-discord-sidebar text-white shadow-lg border border-white/5"
                                : "text-discord-text-muted hover:text-discord-text"
                            }`}
                    >
                        Payments
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Filter by invoice or client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-discord-dark border-none rounded-lg pl-9 pr-4 py-2 text-sm text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none w-64 shadow-xl"
                    />
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-discord-sidebar/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 text-discord-text-muted text-[10px] uppercase font-bold tracking-widest">
                                <th className="px-6 py-4 flex items-center gap-1 cursor-default">
                                    <Calendar size={12} /> Date
                                </th>
                                <th className="px-6 py-4">
                                    <Hash size={12} className="inline mr-1" /> Invoice
                                </th>
                                <th className="px-6 py-4">Client/Supplier</th>
                                <th className="px-6 py-4">Total Amount</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredAndSortedData.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4 text-sm text-discord-text group-hover:text-white">
                                        {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono bg-discord-dark/50 px-2 py-1 rounded text-discord-text-muted">
                                            {tx.invoice_number}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-discord-text">
                                        {tx.client_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-bold ${tx.type === 'collection' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {tx.total.toLocaleString()} EGP
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-discord-text-muted flex items-center gap-2 italic">
                                            {tx.transaction_method ? (
                                                <><Landmark size={12} /> {tx.transaction_method}</>
                                            ) : '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full w-fit ${tx.status === 'Pending'
                                                ? "bg-yellow-400/10 text-yellow-400"
                                                : "bg-emerald-400/10 text-emerald-400"
                                            }`}>
                                            {tx.status === 'Pending' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                                            <span className="text-[10px] font-bold uppercase">{tx.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {tx.status === 'Pending' ? (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedTransaction(tx);
                                                    setCompleteDialogOpen(true);
                                                }}
                                                className="bg-discord-blurple hover:bg-discord-blurple-hover text-white text-[11px] font-bold h-7 px-4 shadow-lg shadow-discord-blurple/20"
                                            >
                                                Complete
                                            </Button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedTransaction(tx);
                                                    setCompleteDialogOpen(true);
                                                }}
                                                className="p-1.5 text-discord-text-muted hover:text-white transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredAndSortedData.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center">
                        <Clock size={48} className="text-discord-text-muted/10 mb-4" />
                        <p className="text-discord-text-muted font-medium">No {activeTab}s found in the treasury.</p>
                    </div>
                )}
            </div>

            <CompleteTransactionDialog
                open={completeDialogOpen}
                onOpenChange={setCompleteDialogOpen}
                transaction={selectedTransaction}
                onSuccess={fetchData}
            />
        </div>
    );
}
