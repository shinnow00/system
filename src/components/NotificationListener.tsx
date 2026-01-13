'use client';
import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';

export default function NotificationListener() {
    const { user } = useUser();
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('global-alerts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new;
                    // Notify if someone else sent a DM or mentioned me
                    if (newMsg.sender_id !== user.id) {
                        if (newMsg.channel_id.includes(user.id)) {
                            toast.success("New Private Message");
                        } else if (newMsg.content.includes('@' + user.email)) {
                            toast.warning("You were mentioned!");
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tasks' },
                (payload) => {
                    const newTask = payload.new;
                    // Notify if assigned to me
                    if (newTask.assigned_to === user.id) {
                        toast.info("New Task Assigned: " + newTask.title);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return null;
}
