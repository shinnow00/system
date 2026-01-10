"use client";

import { useState, useEffect } from "react";
import { Package, Search, Loader2, Plus, FileText, Calendar, Building2, User, MoreHorizontal, ArrowUpRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Task } from "@/types/database";
import CreateQuotationDialog from "../CreateQuotationDialog";
import QuotationCard from "./QuotationCard";
import { Button } from "@/components/ui/button";

export default function QuotationBoard() {
    const [quotations, setQuotations] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

    const fetchQuotations = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("tasks")
            .select("*, profiles!created_by(full_name)")
            .eq("department", "Operations")
            .eq("meta_data->>type", "quotation")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setQuotations(data);
        }
        setLoading(false);
    };

    const handleEdit = (task: Task) => {
        setTaskToEdit(task);
        setIsCreateOpen(true);
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-discord-bg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-discord-sidebar/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-pink-500/10 rounded-lg">
                                <FileText className="text-pink-500" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold text-discord-text tracking-tight">Quotations Control</h1>
                        </div>
                        <p className="text-discord-text-muted text-sm">Manage pricing requests and formal offers</p>
                    </div>

                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 shadow-lg shadow-pink-600/20"
                    >
                        <Plus size={18} />
                        New Quotation
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-pink-500" size={32} />
                    </div>
                ) : quotations.length === 0 ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-discord-text-muted">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <FileText size={24} className="opacity-20" />
                        </div>
                        <h2 className="text-xl font-bold text-discord-text mb-2">No Quotations Yet</h2>
                        <p className="text-center max-w-md text-sm">
                            Created quotations will appear here. Click the button above to start your first pricing offer.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {quotations.map((q) => (
                            <QuotationCard
                                key={q.id}
                                task={q}
                                onEdit={() => handleEdit(q)}
                                onDelete={fetchQuotations}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateQuotationDialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) setTaskToEdit(null);
                }}
                onSuccess={fetchQuotations}
                taskToEdit={taskToEdit}
            />
        </div>
    );
}
