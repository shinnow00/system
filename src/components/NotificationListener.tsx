"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export default function NotificationListener() {
    const { user: currentUser } = useUser();
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        if (!currentUser) return;

        const supabase = supabaseRef.current;

        // Subscribe to notifications
        const channel = supabase
            .channel('global-notifications')
            // A. Task Assignment Notification
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tasks',
                },
                (payload) => {
                    const newTask = payload.new;
                    if (newTask.assigned_to === currentUser.id) {
                        toast.info(`New Task Assigned: ${newTask.title}`, {
                            duration: 5000,
                        });
                    }
                }
            )
            // B. Private Messages & Mentions
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new;

                    // Skip notifications for own messages
                    if (newMsg.sender_id === currentUser.id) return;

                    // Check for Mentions (priority over DM notification if in General)
                    const mentionTextEmail = `@${currentUser.email}`;
                    const mentionTextName = currentUser.full_name ? `@${currentUser.full_name}` : null;

                    const isMentioned = newMsg.content.includes(mentionTextEmail) ||
                        (mentionTextName && newMsg.content.includes(mentionTextName));

                    if (isMentioned) {
                        toast.warning("You were mentioned in Chat!", {
                            description: newMsg.content.slice(0, 100) + (newMsg.content.length > 100 ? "..." : ""),
                            duration: 6000,
                        });
                        // Don't show DM notification if already showed mention
                        return;
                    }

                    // Check for DM
                    // DMs have channel_id formatted as "user1id_user2id"
                    if (newMsg.channel_id.includes('_') && newMsg.channel_id.includes(currentUser.id)) {
                        toast.message("New Direct Message", {
                            description: newMsg.content.slice(0, 100) + (newMsg.content.length > 100 ? "..." : ""),
                            duration: 5000,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    return null;
}
