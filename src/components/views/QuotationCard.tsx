"use client";

import { Download, User, Building2, ArrowUpRight, FileText, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/database";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from "@/utils/supabase/client";
import { formatDate } from "@/utils/formatDate";

interface QuotationCardProps {
    task: Task;
    onEdit: () => void;
    onDelete: () => void;
}

export default function QuotationCard({ task, onEdit, onDelete }: QuotationCardProps) {
    const meta = task.meta_data as any;
    const creatorName = (task as any).profiles?.full_name || "Unknown User";

    const generatePDF = () => {
        const doc = new jsPDF();
        const clientName = meta.client_name || "Client";
        const companyName = meta.company_name || "Individual";
        const date = meta.quotation_date ? formatDate(meta.quotation_date) : formatDate(new Date());

        // Colors
        const darkBlue = [0, 51, 102]; // #003366

        // A. Header & Branding
        doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Ultimate Advertising House", 14, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Black
        doc.text("7, Makram Ebid, Nasr City, Cairo, Egypt", 14, 32);
        doc.text("Phone: +20106-2222-316 / +201022243627", 14, 37);
        doc.text("Email: ultimate-advertising@hotmail.co.uk | info@ultimateadv.com", 14, 42);

        // Blue line separator
        doc.setDrawColor(darkBlue[0], darkBlue[1], darkBlue[2]);
        doc.setLineWidth(0.5);
        doc.line(14, 47, 196, 47);

        // B. Client Info
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("QUOTATION FOR:", 14, 57);
        doc.setFont("helvetica", "normal");
        doc.text(`${clientName}`, 14, 63);
        if (companyName) {
            doc.text(`${companyName}`, 14, 68);
        }
        doc.text(`Date: ${date}`, 160, 63);

        // C. The Table (autoTable)
        const tableRows = (meta.items || []).map((item: any) => [
            item.name,
            item.qty,
            `${(item.price || 0).toLocaleString()} EGP`,
            `${((item.qty || 0) * (item.price || 0)).toLocaleString()} EGP`
        ]);

        autoTable(doc, {
            startY: 75,
            head: [['Item', 'Qty', 'Price', 'Total']],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: darkBlue as any, textColor: [255, 255, 255] },
            margin: { left: 14, right: 14 },
            foot: [
                ['', '', 'Subtotal', `${(meta.sub_total || 0).toLocaleString()} EGP`],
                ['', '', `VAT (${meta.tax_rate || 14}%)`, `${(meta.tax_amount || 0).toLocaleString()} EGP`],
                ['', '', 'Grand Total', `${(meta.grand_total || 0).toLocaleString()} EGP`]
            ],
            footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;

        // D. Terms & Notes
        if (meta.terms && meta.terms.length > 0) {
            doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
            doc.setFont("helvetica", "bold");
            doc.text("Terms of Agreement:", 14, finalY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            meta.terms.forEach((term: string, index: number) => {
                doc.text(`• ${term}`, 14, finalY + 7 + (index * 6));
            });
        }

        const notesY = finalY + (meta.terms?.length || 0) * 8 + 15;

        if (meta.notes && meta.notes.length > 0) {
            doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
            doc.setFont("helvetica", "bold");
            doc.text("Notes:", 14, notesY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            meta.notes.forEach((note: string, index: number) => {
                doc.text(`• ${note}`, 14, notesY + 7 + (index * 6));
            });
        }

        // E. Save
        doc.save(`Quotation_${clientName.replace(/\s+/g, '_')}_${date}.pdf`);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this quotation?")) return;
        const supabase = createClient();
        const { error } = await supabase.from("tasks").delete().eq("id", task.id);
        if (!error) onDelete();
    };

    return (
        <div className="bg-discord-sidebar group hover:bg-discord-sidebar/80 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all duration-300 overflow-hidden flex flex-col shadow-lg relative">
            {/* Action Overlay */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                    onClick={onEdit}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-discord-dark/50 hover:bg-pink-500/20 hover:text-pink-500 text-discord-text-muted"
                >
                    <Edit size={14} />
                </Button>
                <Button
                    onClick={handleDelete}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-discord-dark/50 hover:bg-red-500/20 hover:text-red-500 text-discord-text-muted"
                >
                    <Trash2 size={14} />
                </Button>
            </div>

            <div className="h-1.5 w-full bg-pink-500" />
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-discord-dark rounded-lg border border-white/5">
                        <FileText className="text-pink-500" size={18} />
                    </div>
                    <div className="px-2 py-1 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20 text-[10px] font-black uppercase tracking-widest">
                        {meta.ops_status || 'Quoted'}
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-bold text-discord-text leading-tight mb-1 group-hover:text-pink-500 transition-colors">
                        {meta.client_name}
                    </h3>
                    <div className="text-xs text-discord-text-muted font-bold flex items-center gap-1.5 mb-2">
                        <Building2 size={12} className="text-pink-500" />
                        {meta.company_name || 'Individual'}
                    </div>
                    <div className="text-[10px] text-discord-text-muted flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                        <User size={10} className="text-discord-text-muted" />
                        Created By: <span className="text-discord-text">{creatorName}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="text-[9px] font-black text-discord-text-muted uppercase tracking-widest mb-1">Total Amount</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                            {(meta.grand_total || 0).toLocaleString()} EGP
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={generatePDF}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-discord-text-muted hover:text-pink-500 hover:bg-pink-500/10"
                            title="Download PDF"
                        >
                            <Download size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-discord-text-muted hover:text-discord-text hover:bg-white/5"
                        >
                            <ArrowUpRight size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
