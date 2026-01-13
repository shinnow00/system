'use client';
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationListener() {
    const { user: userProfile } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!userProfile) return;

        const supabase = createClient();
        console.log("DEBUG: Initializing Global Notification Listener for", userProfile.email);

        const channel = supabase
            .channel('global-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, async (payload) => {
                const newTask = payload.new;
                if (newTask.assigned_to === userProfile.id) {
                    const { data: sender } = await supabase.from('profiles').select('full_name, email').eq('id', newTask.created_by).single();
                    const senderName = sender?.full_name || sender?.email || "System";

                    toast.custom((t) => (
                        <div
                            onClick={() => {
                                // Attempt to parse meta_data for specific redirects
                                const meta = newTask.meta_data as any;
                                if (meta?.type === 'meta-ads') {
                                    router.push('/?dept=social&channel=meta-ads');
                                } else if (newTask.department === 'Social Media') {
                                    router.push('/?dept=social&channel=calendar');
                                } else if (newTask.department === 'Operations') {
                                    router.push('/?dept=ops&channel=pricing');
                                } else {
                                    router.push(`/?dept=${newTask.department?.toLowerCase() || 'home'}`);
                                }
                                toast.dismiss(t);
                            }}
                            className="bg-[#1E1F22] border border-[#2B2D31] p-4 rounded-md shadow-lg flex gap-3 w-80 text-white animate-in fade-in slide-in-from-top-4 duration-300 cursor-pointer hover:bg-[#2B2D31] transition-colors"
                        >
                            <div className="bg-discord-blurple w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                {senderName[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">New Task Assigned</p>
                                <p className="text-sm text-[#B5BAC1] truncate">{newTask.title}</p>
                                <p className="text-[10px] text-[#949BA4] mt-1">From: {senderName}</p>
                            </div>
                        </div>
                    ));
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                const newMsg = payload.new;
                // Identify if it's a DM (channel_id contains both user IDs separated by _)
                const isDM = newMsg.channel_id.includes('_') && newMsg.channel_id.includes(userProfile.id);
                const isMention = newMsg.content.includes('@' + userProfile.email) || (userProfile.full_name && newMsg.content.includes('@' + userProfile.full_name));

                if (newMsg.sender_id !== userProfile.id && (isDM || isMention)) {
                    const { data: sender } = await supabase.from('profiles').select('full_name, email').eq('id', newMsg.sender_id).single();
                    const senderName = sender?.full_name || sender?.email || "User";
                    const title = isDM ? "New Private Message" : "You were mentioned!";

                    toast.custom((t) => (
                        <div
                            onClick={() => {
                                if (isDM) {
                                    router.push(`/?dept=home&channel=${newMsg.channel_id}`);
                                } else {
                                    router.push(`/?dept=home&channel=general`);
                                }
                                toast.dismiss(t);
                            }}
                            className="bg-[#1E1F22] border border-[#2B2D31] p-4 rounded-md shadow-lg flex gap-3 w-80 text-white animate-in fade-in slide-in-from-top-4 duration-300 cursor-pointer hover:bg-[#2B2D31] transition-colors"
                        >
                            <div className="bg-discord-blurple w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                {senderName[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{title}</p>
                                <p className="text-sm text-[#B5BAC1] truncate">{newMsg.content}</p>
                                <p className="text-[10px] text-[#949BA4] mt-1">From: {senderName}</p>
                            </div>
                        </div>
                    ));
                }
            })
            .subscribe((status) => {
                console.log("DEBUG: Global Subscription Status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile]);

    return null;
}
