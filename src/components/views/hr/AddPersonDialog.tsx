"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Personnel, Profile } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Save, User, Briefcase, Phone, CreditCard, GraduationCap, Shield, FileText, Link as LinkIcon, CalendarDays } from "lucide-react";

interface AddPersonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    person?: Personnel | null;
    onSuccess: () => void;
}

export default function AddPersonDialog({
    open,
    onOpenChange,
    person,
    onSuccess,
}: AddPersonDialogProps) {
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [fullName, setFullName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [qualification, setQualification] = useState("");
    const [insuranceStatus, setInsuranceStatus] = useState<Personnel['insurance_status']>("None");
    const [notes, setNotes] = useState("");
    const [profileId, setProfileId] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [annualBalance, setAnnualBalance] = useState<number>(21);

    useEffect(() => {
        if (open) {
            fetchProfiles();
            if (person) {
                setFullName(person.full_name);
                setJobTitle(person.job_title);
                setPhoneNumber(person.phone_number);
                setNationalId(person.national_id);
                setQualification(person.qualification);
                setInsuranceStatus(person.insurance_status);
                setNotes(person.notes || "");
                setProfileId(person.profile_id || "");
                setStartDate(person.start_date || "");
                setAnnualBalance(person.annual_balance !== undefined && person.annual_balance !== null ? person.annual_balance : 21);
            } else {
                resetForm();
            }
        }
    }, [open, person]);

    const fetchProfiles = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .order("full_name");
        setProfiles(data || []);
    };

    const resetForm = () => {
        setFullName("");
        setJobTitle("");
        setPhoneNumber("");
        setNationalId("");
        setQualification("");
        setInsuranceStatus("None");
        setNotes("");
        setProfileId("");
        setStartDate("");
        setAnnualBalance(21);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const payload = {
            full_name: fullName,
            job_title: jobTitle,
            phone_number: phoneNumber,
            national_id: nationalId,
            qualification,
            insurance_status: insuranceStatus,
            notes,
            profile_id: profileId || null,
            start_date: startDate || null,
            annual_balance: annualBalance,
        };

        try {
            if (person) {
                // Update
                const { error: updateError } = await supabase
                    .from("personnel")
                    .update(payload)
                    .eq("id", person.id);
                if (updateError) throw updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from("personnel")
                    .insert(payload);
                if (insertError) throw insertError;
            }

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error saving personnel:", err);
            setError(err.message || "Failed to save personnel record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-discord-sidebar border-white/10 text-discord-text max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {person ? <User className="text-discord-blurple" /> : <Plus className="text-discord-blurple" />}
                        {person ? "Edit Personnel Record" : "Add New Person"}
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        {person ? "Update employee information in the database." : "Create a new employee record in the database."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <User size={14} /> Full Name
                            </label>
                            <input
                                required
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                placeholder="John Doe"
                            />
                        </div>

                        {/* Job Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <Briefcase size={14} /> Job Title
                            </label>
                            <input
                                required
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                placeholder="Software Engineer"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <Phone size={14} /> Phone Number
                            </label>
                            <input
                                required
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                placeholder="+1 234 567 890"
                            />
                        </div>

                        {/* National ID */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <CreditCard size={14} /> National ID
                            </label>
                            <input
                                required
                                type="text"
                                value={nationalId}
                                onChange={(e) => setNationalId(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                placeholder="ID Number"
                            />
                        </div>

                        {/* Qualification */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <GraduationCap size={14} /> Qualification
                            </label>
                            <input
                                required
                                type="text"
                                value={qualification}
                                onChange={(e) => setQualification(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                                placeholder="Bachelor's Degree..."
                            />
                        </div>

                        {/* Insurance Status */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <Shield size={14} /> Insurance Status
                            </label>
                            <select
                                value={insuranceStatus}
                                onChange={(e) => setInsuranceStatus(e.target.value as any)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            >
                                <option value="None">None</option>
                                <option value="Insured">Insured</option>
                                <option value="Social Insurance">Social Insurance</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <CalendarDays size={14} /> Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            />
                        </div>

                        {/* Annual Balance */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <CalendarDays size={14} /> Annual Balance (Days)
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={annualBalance}
                                onChange={(e) => setAnnualBalance(parseFloat(e.target.value))}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            />
                        </div>

                        {/* System User Link */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                                <LinkIcon size={14} /> Link to System User (Optional)
                            </label>
                            <select
                                value={profileId}
                                onChange={(e) => setProfileId(e.target.value)}
                                className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none"
                            >
                                <option value="">-- No Linked User --</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.full_name || p.email} ({p.email})
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-discord-text-muted">
                                Linking to a system user connects this record to their login account.
                            </p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-discord-text-muted uppercase tracking-wider flex items-center gap-1">
                            <FileText size={14} /> Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-discord-dark border-none rounded-lg p-3 text-discord-text focus:ring-2 focus:ring-discord-blurple outline-none min-h-[80px]"
                            placeholder="Additional notes..."
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="hover:bg-white/5 text-discord-text-muted hover:text-discord-text"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-discord-blurple hover:bg-discord-blurple-hover text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Record
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
