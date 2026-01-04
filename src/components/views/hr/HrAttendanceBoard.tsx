"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Profile, Attendance } from "@/types/database";
import {
    Users,
    ClipboardCheck,
    Calendar,
    TrendingUp,
    TrendingDown,
    Loader2,
    AlertCircle,
    CheckCircle2,
    CalendarClock
} from "lucide-react";
import { format, subDays, parseISO } from "date-fns";

export default function HrAttendanceBoard() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [history, setHistory] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [status, setStatus] = useState<"Present" | "Absent" | "Late">("Present");
    const [bonus, setBonus] = useState(0);
    const [deduction, setDeduction] = useState(0);

    // Filter state
    const [filterMode, setFilterMode] = useState<"Today" | "Yesterday" | "Custom">("Today");
    const [customDate, setCustomDate] = useState(format(new Date(), "yyyy-MM-dd"));

    useEffect(() => {
        fetchData();
    }, [filterMode, customDate]);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            // Fetch all profiles
            const { data: profs, error: profsError } = await supabase
                .from("profiles")
                .select("*")
                .neq("role", "Super-Admin")
                .order("email", { ascending: true });

            if (profsError) throw profsError;
            setProfiles(profs || []);

            // Calculate filter date
            let targetDate = format(new Date(), "yyyy-MM-dd");
            if (filterMode === "Yesterday") {
                targetDate = format(subDays(new Date(), 1), "yyyy-MM-dd");
            } else if (filterMode === "Custom") {
                targetDate = customDate;
            }

            // Fetch attendance history
            const { data: att, error: attError } = await supabase
                .from("attendance")
                .select(`
                    *,
                    profiles:user_id (
                        email,
                        full_name
                    )
                `)
                .eq("date", targetDate)
                .order("created_at", { ascending: false });

            if (attError) throw attError;
            setHistory(att || []);
        } catch (err: any) {
            console.error("Error fetching HR data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) {
            setError("Please select an employee");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(false);

        const supabase = createClient();
        const today = format(new Date(), "yyyy-MM-dd");

        try {
            const { error: insertError } = await supabase
                .from("attendance")
                .insert({
                    user_id: selectedEmployee,
                    status,
                    bonus,
                    deduction,
                    date: today,
                });

            if (insertError) throw insertError;

            setSuccess(true);
            setSelectedEmployee("");
            setStatus("Present");
            setBonus(0);
            setDeduction(0);
            fetchData(); // Refresh history

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Error marking attendance:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && history.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-discord-blurple" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Top Section: Mark Attendance Form */}
            <div className="bg-discord-sidebar rounded-xl p-6 border border-white/5 shadow-xl">
                <h2 className="text-lg font-bold text-discord-text mb-6 flex items-center gap-2">
                    <Calendar size={20} className="text-discord-blurple" />
                    Mark Daily Attendance
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 size={16} />
                        Attendance marked successfully!
                    </div>
                )}

                <form onSubmit={handleMarkAttendance} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* Employee Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider">Employee</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none transition-all"
                        >
                            <option value="">Select Employee...</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name || p.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none transition-all"
                        >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                        </select>
                    </div>

                    {/* Bonus */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp size={14} className="text-green-400" />
                            Bonus ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={bonus}
                            onChange={(e) => setBonus(Number(e.target.value))}
                            min="0"
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none transition-all"
                        />
                    </div>

                    {/* Deduction */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                            <CalendarClock size={14} className="text-red-400" />
                            Deduction (Days)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={deduction}
                            onChange={(e) => setDeduction(Number(e.target.value))}
                            min="0"
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none transition-all"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-discord-blurple hover:bg-discord-blurple-hover disabled:opacity-50 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-2 h-[48px]"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : "Mark Attendance"}
                    </button>
                </form>
            </div>

            {/* Bottom Section: History Table */}
            <div className="bg-discord-sidebar rounded-xl border border-white/5 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-discord-sidebar/50">
                    <h2 className="text-lg font-bold text-discord-text flex items-center gap-2">
                        <Users size={20} className="text-discord-blurple" />
                        Recent Logs
                    </h2>
                </div>

                {/* Filter Controls */}
                <div className="p-4 bg-discord-dark/30 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex bg-discord-dark p-1 rounded-lg border border-white/5">
                        {(["Today", "Yesterday", "Custom"] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${filterMode === mode
                                    ? "bg-discord-blurple text-white shadow-sm"
                                    : "text-discord-text-muted hover:text-discord-text hover:bg-white/5"
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {filterMode === "Custom" && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Calendar size={16} className="text-discord-text-muted" />
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="bg-discord-dark border border-white/10 rounded px-3 py-1.5 text-sm text-discord-text focus:border-discord-blurple outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-discord-dark/50 p-4">
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider text-center">Bonus</th>
                                <th className="px-6 py-4 text-xs font-bold text-discord-text-muted uppercase tracking-wider text-center">Deduction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-discord-text-muted">
                                        No attendance records found.
                                    </td>
                                </tr>
                            ) : (
                                history.map((record) => (
                                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-discord-text font-medium">
                                                {format(new Date(record.date), "MMM dd, yyyy")}
                                            </div>
                                            <div className="text-[10px] text-discord-text-muted uppercase">
                                                {format(new Date(record.created_at), "hh:mm a")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-discord-blurple/20 flex items-center justify-center text-discord-blurple font-bold text-xs">
                                                    {(record.profiles?.full_name || record.profiles?.email || "?")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-discord-text">
                                                        {record.profiles?.full_name || "Unknown User"}
                                                    </div>
                                                    <div className="text-xs text-discord-text-muted">
                                                        {record.profiles?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${record.status === "Present" ? "bg-green-500/20 text-green-400" :
                                                record.status === "Late" ? "bg-yellow-500/20 text-yellow-500" :
                                                    "bg-red-500/20 text-red-500"
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={record.bonus > 0 ? "text-green-400 font-bold" : "text-discord-text-muted"}>
                                                {record.bonus > 0 ? `+$${record.bonus}` : "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={record.deduction > 0 ? "text-red-400 font-bold" : "text-discord-text-muted"}>
                                                {record.deduction > 0 ? `${record.deduction} Days` : "-"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
