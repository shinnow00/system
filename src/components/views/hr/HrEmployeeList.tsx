"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database";
import { Users, Loader2, DollarSign, Check, X, Search, ClipboardList } from "lucide-react";
import EmployeeAttendanceDialog from "./EmployeeAttendanceDialog";

export default function HrEmployeeList() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempSalary, setTempSalary] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog State
    const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .neq("role", "Super-Admin")
                .order("department", { ascending: true })
                .order("full_name", { ascending: true });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error("Error fetching profiles:", error);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (profile: Profile) => {
        setEditingId(profile.id);
        setTempSalary(profile.salary ? profile.salary.toString() : "");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setTempSalary("");
    };

    const saveSalary = async (id: string) => {
        setSaving(true);
        const supabase = createClient();
        const newSalary = tempSalary ? parseFloat(tempSalary) : null;

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ salary: newSalary })
                .eq("id", id);

            if (error) throw error;

            // Update local state
            setProfiles(profiles.map(p =>
                p.id === id ? { ...p, salary: newSalary } : p
            ));
            setEditingId(null);
        } catch (error) {
            console.error("Error updating salary:", error);
            alert("Failed to update salary");
        } finally {
            setSaving(false);
        }
    };

    const filteredProfiles = profiles.filter(p =>
    (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-discord-blurple" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-discord-sidebar rounded-xl p-6 border border-white/5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-discord-text flex items-center gap-2">
                            <Users size={20} className="text-discord-blurple" />
                            Employee Management
                        </h2>
                        <p className="text-discord-text-muted text-sm mt-1">
                            Manage employee records and compensation
                        </p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-discord-dark border-none rounded-lg pl-9 pr-4 py-2 text-sm text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-discord-dark/50">
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Role & Dept</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Base Salary</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-discord-sidebar/50">
                            {filteredProfiles.map((p) => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-discord-blurple/20 flex items-center justify-center text-discord-blurple font-bold text-sm">
                                                {(p.full_name || p.email)[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-discord-text">
                                                    {p.full_name || "Unknown"}
                                                </div>
                                                <div className="text-xs text-discord-text-muted">
                                                    {p.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-discord-text">{p.role}</span>
                                            <span className="text-[10px] uppercase font-bold text-discord-text-muted bg-discord-dark/50 self-start px-2 py-0.5 rounded">
                                                {p.department}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === p.id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-32">
                                                    <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-discord-text-muted" />
                                                    <input
                                                        type="number"
                                                        value={tempSalary}
                                                        onChange={(e) => setTempSalary(e.target.value)}
                                                        className="w-full bg-discord-dark border border-discord-blurple rounded px-2 pl-6 py-1.5 text-sm text-discord-text outline-none"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveSalary(p.id);
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => saveSalary(p.id)}
                                                    disabled={saving}
                                                    className="p-1.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                                >
                                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    disabled={saving}
                                                    className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => startEditing(p)}
                                                className="group/salary flex items-center gap-2 cursor-pointer py-1 px-2 -ml-2 rounded hover:bg-white/[0.05] transition-colors w-fit"
                                            >
                                                <span className={`text-sm font-mono ${p.salary ? "text-green-400" : "text-discord-text-muted italic"}`}>
                                                    {p.salary ? `$${p.salary.toLocaleString()}` : "Set Salary"}
                                                </span>
                                                <div className="opacity-0 group-hover/salary:opacity-100 transition-opacity">
                                                    <DollarSign size={14} className="text-discord-text-muted" />
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedEmployee(p);
                                                setIsDialogOpen(true);
                                            }}
                                            className="p-2 hover:bg-discord-blurple/20 text-discord-text-muted hover:text-discord-blurple rounded transition-colors group/btn"
                                            title="View Attendance details"
                                        >
                                            <ClipboardList size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProfiles.length === 0 && (
                        <div className="p-8 text-center text-discord-text-muted text-sm">
                            No employees found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            </div>

            <EmployeeAttendanceDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                employee={selectedEmployee}
            />
        </div>
    );
}
