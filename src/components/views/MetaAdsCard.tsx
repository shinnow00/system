"use client";

import { Task } from "@/types/database";
import { format } from "date-fns";
import { Calendar, Layout } from "lucide-react";

interface MetaAdsCardProps {
    task: Task;
}

const objectiveColors: Record<string, string> = {
    'Awareness': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Sales': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Traffic': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Engagement': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Leads': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'App Promotion': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

export default function MetaAdsCard({ task }: MetaAdsCardProps) {
    const meta = (task.meta_data as any) || {};
    const objective = meta.campaign_objective || 'Unknown';
    const accountName = meta.account_name || 'N/A';
    const campaignDate = meta.campaign_date ? new Date(meta.campaign_date) : null;

    const badgeStyle = objectiveColors[objective] || 'bg-discord-item text-discord-text-muted border-white/5';

    return (
        <div className="bg-discord-sidebar rounded-xl p-5 border border-white/5 hover:border-discord-blurple/30 transition-all group flex flex-col h-full shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-discord-blurple/10 flex items-center justify-center text-discord-blurple group-hover:bg-discord-blurple group-hover:text-white transition-colors">
                    <Layout size={20} />
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
                    {objective}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <p className="text-[10px] font-bold text-discord-text-muted uppercase tracking-widest mb-1">
                    Ad Account
                </p>
                <h3 className="text-lg font-bold text-discord-text leading-tight mb-4">
                    {accountName}
                </h3>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-discord-text-muted">
                    <Calendar size={14} className="opacity-50" />
                    <span className="text-xs font-medium">
                        {campaignDate ? format(campaignDate, "MMM d, yyyy") : "No Date"}
                    </span>
                </div>
                <div className="text-[9px] font-black text-discord-text-muted/30 uppercase tracking-tighter">
                    Meta Ads
                </div>
            </div>
        </div>
    );
}
