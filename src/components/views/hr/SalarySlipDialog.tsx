"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Personnel } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Calculator, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

interface SalarySlipDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Personnel | null;
}

export default function SalarySlipDialog({ isOpen, onClose, employee }: SalarySlipDialogProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [insuranceCost, setInsuranceCost] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [payslip, setPayslip] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!employee) return;
        setGenerating(true);
        setError(null);
        setPayslip(null);

        const supabase = createClient();
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        try {
            // Fetch attendance
            const { data: attendance, error: attendanceError } = await supabase
                .from("attendance")
                .select("*")
                .eq("personnel_id", employee.id)
                .gte("date", start)
                .lte("date", end);

            if (attendanceError) throw attendanceError;

            // Calculations
            const records = attendance || [];
            const baseSalary = employee.salary || 0;
            const totalBonus = records.reduce((acc, curr) => acc + (curr.bonus || 0), 0);

            // Deduction Days
            const totalDayDeductions = records.reduce((acc, curr) => acc + (curr.deduction || 0), 0);
            const dayRate = baseSalary / 30;
            const dayDeductionCost = totalDayDeductions * dayRate;

            // Cash Deductions
            const totalCashDeductions = records.reduce((acc, curr) => acc + (curr.deduction_amount || 0), 0);

            const gross = baseSalary + totalBonus;
            const totalDeductions = dayDeductionCost + totalCashDeductions + insuranceCost;
            const netSalary = gross - totalDeductions;

            setPayslip({
                baseSalary,
                totalBonus,
                totalDayDeductions,
                dayDeductionCost,
                totalCashDeductions,
                insuranceCost,
                netSalary: Math.max(0, netSalary) // Prevent negative salary display
            });
        } catch (err: any) {
            console.error("Error generating payslip:", err);
            setError("Failed to calculate salary.");
        } finally {
            setGenerating(false);
        }
    };

    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text w-[95vw] sm:max-w-md max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-discord-blurple" />
                        Generate Payslip
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Calculate salary for {employee.full_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Controls */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 bg-discord-dark p-1.5 rounded-lg border border-white/5 flex-1">
                            <button
                                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                className="p-1 hover:bg-white/5 rounded text-discord-text-muted hover:text-discord-text"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-bold text-discord-text flex-1 text-center">
                                {format(currentDate, "MMMM yyyy")}
                            </span>
                            <button
                                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                className="p-1 hover:bg-white/5 rounded text-discord-text-muted hover:text-discord-text"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider">
                            Insurance Cost ($)
                        </label>
                        <input
                            type="number"
                            value={insuranceCost}
                            onChange={(e) => setInsuranceCost(Number(e.target.value))}
                            min="0"
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-discord-blurple hover:bg-discord-blurple-hover text-white font-bold"
                    >
                        {generating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Calculate Salary"}
                    </Button>

                    {/* Output */}
                    {payslip && (
                        <div className="bg-discord-dark rounded-lg p-4 border border-white/5 space-y-3 animation-fade-in">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center text-discord-text-muted">
                                    <span>Base Salary</span>
                                    <span className="font-mono text-discord-text">${payslip.baseSalary.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-400">
                                    <span>(+) Bonuses</span>
                                    <span className="font-mono">+${payslip.totalBonus.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-red-400">
                                    <span>(-) Absence/Late ({payslip.totalDayDeductions} Days)</span>
                                    <span className="font-mono">-${payslip.dayDeductionCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-red-400">
                                    <span>(-) Cash Penalties</span>
                                    <span className="font-mono">-${payslip.totalCashDeductions.toLocaleString()}</span>
                                </div>
                                {payslip.insuranceCost > 0 && (
                                    <div className="flex justify-between items-center text-red-400">
                                        <span>(-) Insurance</span>
                                        <span className="font-mono">-${payslip.insuranceCost.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-white/10 my-2" />

                            <div className="flex justify-between items-center pt-2">
                                <span className="font-bold text-discord-text uppercase tracking-wider text-sm">Final Pay</span>
                                <span className="text-2xl font-black text-discord-blurple">
                                    ${payslip.netSalary.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm text-center">{error}</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
