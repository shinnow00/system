"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Attendance } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, CalendarClock, Edit } from "lucide-react";

interface EditAttendanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record: Attendance | null;
    onSuccess: () => void;
}

export default function EditAttendanceDialog({
    open,
    onOpenChange,
    record,
    onSuccess,
}: EditAttendanceDialogProps) {
    const [status, setStatus] = useState<"Present" | "Absent" | "Late">("Present");
    const [bonus, setBonus] = useState(0);
    const [deduction, setDeduction] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (record) {
            setStatus(record.status);
            setBonus(record.bonus || 0);
            setDeduction(record.deduction || 0);
        }
    }, [record]);

    const handleSave = async () => {
        if (!record) return;

        setSaving(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: updateError } = await supabase
                .from("attendance")
                .update({
                    status,
                    bonus,
                    deduction,
                })
                .eq("id", record.id);

            if (updateError) throw updateError;

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error updating attendance:", err);
            setError(err.message || "Failed to update record");
        } finally {
            setSaving(false);
        }
    };

    if (!record) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-discord-blurple" />
                        Edit Attendance Record
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        Update attendance details for {record.profiles?.full_name || record.profiles?.email}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                        >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
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
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-white/5 text-discord-text-muted hover:text-discord-text"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-discord-blurple hover:bg-discord-blurple-hover text-white"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
