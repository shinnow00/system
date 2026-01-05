"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Personnel } from "@/types/database";
import { Search, Database, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import AddPersonDialog from "./AddPersonDialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function HrDatabaseBoard() {
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchPersonnel();
    }, []);

    const fetchPersonnel = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("personnel")
                .select(`
                    *,
                    profile:profile_id (
                        email,
                        full_name
                    )
                `)
                .order("full_name", { ascending: true });

            if (error) throw error;
            setPersonnel(data || []);
        } catch (error) {
            console.error("Error fetching personnel:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        const supabase = createClient();
        try {
            const { error } = await supabase
                .from("personnel")
                .delete()
                .eq("id", deleteId);

            if (error) throw error;
            fetchPersonnel();
        } catch (error) {
            console.error("Error deleting record:", error);
        } finally {
            setDeleteId(null);
        }
    };

    const filteredPersonnel = personnel.filter(p =>
    (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.national_id?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && personnel.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-discord-blurple" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-discord-sidebar rounded-xl p-6 border border-white/5 shadow-xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-discord-text flex items-center gap-2">
                            <Database size={20} className="text-discord-blurple" />
                            Personnel Directory
                        </h2>
                        <p className="text-discord-text-muted text-sm mt-1">
                            Complete database of all employees and personnel
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search personnel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg pl-9 pr-4 py-2 text-sm text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setEditingPerson(null);
                                setIsAddDialogOpen(true);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} />
                            Add Person
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-discord-dark/50">
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Role & Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">National ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Started</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Annuals Left</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Insurance</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-discord-sidebar/50">
                            {filteredPersonnel.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-discord-text-muted">
                                        No personnel records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPersonnel.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-discord-blurple/20 flex items-center justify-center text-discord-blurple font-bold text-sm">
                                                    {(p.full_name || "?")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-discord-text">
                                                        {p.full_name}
                                                    </div>
                                                    {p.profile && (
                                                        <div className="text-xs text-discord-blurple flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-discord-blurple"></span>
                                                            Linked Profile
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-discord-text">{p.job_title}</div>
                                            <div className="text-xs text-discord-text-muted">{p.qualification}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-discord-text font-mono">{p.phone_number}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-discord-text font-mono tracking-wide">
                                                {p.national_id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-discord-text">
                                                {p.start_date ? new Date(p.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-discord-text">
                                                {p.annual_balance !== undefined && p.annual_balance !== null ? `${p.annual_balance} Days` : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${p.insurance_status === "Insured" ? "bg-green-500/20 text-green-400" :
                                                p.insurance_status === "Social Insurance" ? "bg-blue-500/20 text-blue-400" :
                                                    p.insurance_status === "Pending" ? "bg-yellow-500/20 text-yellow-500" :
                                                        "bg-white/5 text-discord-text-muted"
                                                }`}>
                                                {p.insurance_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingPerson(p);
                                                        setIsAddDialogOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-discord-blurple/20 text-discord-text-muted hover:text-discord-blurple rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(p.id)}
                                                    className="p-2 hover:bg-red-500/20 text-discord-text-muted hover:text-red-500 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddPersonDialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) setEditingPerson(null);
                }}
                person={editingPerson}
                onSuccess={() => {
                    fetchPersonnel();
                    setIsAddDialogOpen(false);
                    setEditingPerson(null);
                }}
            />

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text">
                    <DialogHeader>
                        <DialogTitle>Delete Personnel Record?</DialogTitle>
                        <DialogDescription className="text-discord-text-muted">
                            Are you sure you want to delete this record? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteId(null)}
                            className="hover:bg-white/5 text-discord-text-muted hover:text-discord-text"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
