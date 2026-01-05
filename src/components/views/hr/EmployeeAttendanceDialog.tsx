"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Personnel, Attendance } from "@/types/database";
import {
    X,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock,
    TrendingUp,
    TrendingDown,
    Loader2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from "date-fns";

interface EmployeeAttendanceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Personnel | null;
}

export default function EmployeeAttendanceDialog({ isOpen, onClose, employee }: EmployeeAttendanceDialogProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && employee) {
            fetchAttendance();
        }
    }, [isOpen, employee, currentDate]);

    const fetchAttendance = async () => {
        if (!employee) return;
        setLoading(true);
        const supabase = createClient();

        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        try {
            const { data, error } = await supabase
                .from("attendance")
                .select("*")
                .eq("personnel_id", employee.id)
                .gte("date", start)
                .lte("date", end)
                .order("date", { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error("Error fetching attendance details:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        present: records.length,
        late: records.filter(r => r.status === "Late").length,
        // Since we changed deduction to Days, we sum them up as days
        deductions_days: records.reduce((acc, curr) => acc + (curr.deduction || 0), 0),
        deductions_amount: records.reduce((acc, curr) => acc + (curr.deduction_amount || 0), 0),
        bonus: records.reduce((acc, curr) => acc + (curr.bonus || 0), 0),
    };

    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-discord-sidebar w-[95vw] md:max-w-4xl max-h-[95vh] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-discord-sidebar">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-discord-blurple/20 flex items-center justify-center text-discord-blurple font-bold text-lg">
                            {(employee.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-discord-text">
                                {employee.full_name || "Unknown"}
                            </h2>
                            <p className="text-sm text-discord-text-muted">Attendance Record</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 text-discord-text-muted hover:text-discord-text transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Controls & Stats */}
                <div className="p-6 bg-discord-dark/30 space-y-6">
                    {/* Month Selector */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 bg-discord-dark p-2 rounded-lg border border-white/5">
                            <button
                                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                className="p-1 hover:bg-white/5 rounded text-discord-text-muted hover:text-discord-text"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-discord-text font-bold w-32 text-center">
                                {format(currentDate, "MMMM yyyy")}
                            </span>
                            <button
                                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                className="p-1 hover:bg-white/5 rounded text-discord-text-muted hover:text-discord-text"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div className="text-xs text-discord-text-muted uppercase font-bold tracking-wider">
                            Summary for {format(currentDate, "MMM yyyy")}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-discord-dark p-4 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-green-400">
                                <CheckCircle2 size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Days Present</span>
                            </div>
                            <div className="text-2xl font-bold text-discord-text">{stats.present}</div>
                        </div>
                        <div className="bg-discord-dark p-4 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-yellow-500">
                                <Clock size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Days Late</span>
                            </div>
                            <div className="text-2xl font-bold text-discord-text">{stats.late}</div>
                        </div>
                        <div className="bg-discord-dark p-4 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-red-400">
                                <TrendingDown size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Total Deductions</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-discord-text">{stats.deductions_days} <span className="text-xs font-normal text-discord-text-muted">Days</span></span>
                                {stats.deductions_amount > 0 && (
                                    <span className="text-sm font-bold text-red-400">${stats.deductions_amount}</span>
                                )}
                            </div>
                        </div>
                        <div className="bg-discord-dark p-4 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-green-400">
                                <TrendingUp size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Total Bonus</span>
                            </div>
                            <div className="text-2xl font-bold text-discord-text">${stats.bonus}</div>
                        </div>
                    </div>
                </div>

                {/* List View */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex h-full items-center justify-center min-h-[200px]">
                            <Loader2 className="animate-spin text-discord-blurple" size={32} />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-discord-text-muted">
                            <Calendar size={48} className="mb-4 opacity-20" />
                            <p>No attendance records found for this month.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-discord-dark/50 border-b border-white/5">
                                    <th className="px-4 py-3 text-xs font-bold text-discord-text-muted uppercase">Date</th>
                                    <th className="px-4 py-3 text-xs font-bold text-discord-text-muted uppercase text-center">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-discord-text-muted uppercase text-center">Deduction (Days)</th>
                                    <th className="px-4 py-3 text-xs font-bold text-discord-text-muted uppercase text-center">Deduction ($)</th>
                                    <th className="px-4 py-3 text-xs font-bold text-discord-text-muted uppercase text-center">Bonus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-white/[0.02]">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-bold text-discord-text">
                                                {format(new Date(record.date), "MMM dd, EEE")}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${record.status === "Present" ? "bg-green-500/20 text-green-400" :
                                                record.status === "Late" ? "bg-yellow-500/20 text-yellow-500" :
                                                    "bg-red-500/20 text-red-500"
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {record.deduction > 0 ? (
                                                <span className="text-red-400 font-bold text-sm">
                                                    -{record.deduction} Days
                                                </span>
                                            ) : (
                                                <span className="text-discord-text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                {record.deduction_amount && record.deduction_amount > 0 ? (
                                                    <span className="text-red-400 font-bold text-sm">
                                                        -${record.deduction_amount}
                                                    </span>
                                                ) : (
                                                    <span className="text-discord-text-muted">-</span>
                                                )}
                                                {record.deduction_reason && (
                                                    <span className="text-[10px] text-discord-text-muted max-w-[80px] truncate" title={record.deduction_reason}>
                                                        {record.deduction_reason}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {record.bonus > 0 ? (
                                                <span className="text-green-400 font-bold text-sm">
                                                    +${record.bonus}
                                                </span>
                                            ) : (
                                                <span className="text-discord-text-muted">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
