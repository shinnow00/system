'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Bell } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

export default function MissedNotificationsDialog() {
    const { user: userProfile } = useUser();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingRead, setMarkingRead] = useState(false);

    useEffect(() => {
        const fetchUnread = async () => {
            if (!userProfile) return;

            const supabase = createClient();
            const { data, error } = await supabase
                .from("notifications")
                .select("*, profiles:sender_id(full_name, email)")
                .eq("user_id", userProfile.id)
                .eq("is_read", false)
                .order("created_at", { ascending: false });

            if (!error && data && data.length > 0) {
                setNotifications(data);
                setOpen(true);
            }
            setLoading(false);
        };

        fetchUnread();
    }, [userProfile]);

    const handleMarkAllRead = async () => {
        if (!userProfile) return;
        setMarkingRead(true);

        const supabase = createClient();
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userProfile.id)
            .eq("is_read", false);

        if (!error) {
            setOpen(false);
            setNotifications([]);
        }
        setMarkingRead(false);
    };

    if (loading || !open || notifications.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-discord-sidebar border-discord-dark w-[95vw] max-w-md max-h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-discord-text flex items-center gap-2">
                        <Bell className="text-discord-blurple" size={20} />
                        Missed Notifications
                    </DialogTitle>
                    <DialogDescription className="text-discord-text-muted">
                        You have {notifications.length} unread notifications from while you were away.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
                    {notifications.map((n) => {
                        const senderName = n.profiles?.full_name || n.profiles?.email || "Unknown User";
                        return (
                            <div key={n.id} className="bg-discord-dark/50 p-3 rounded-lg border border-white/5">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-discord-blurple uppercase tracking-wider">{n.title}</span>
                                    <span className="text-[10px] text-discord-text-muted">{formatDate(n.created_at)}</span>
                                </div>
                                <p className="text-sm text-discord-text mb-2 line-clamp-2">{n.content}</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-discord-blurple flex items-center justify-center text-[10px] font-bold text-white">
                                        {senderName[0].toUpperCase()}
                                    </div>
                                    <span className="text-xs text-discord-text-muted">From: {senderName}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="p-6 pt-4 bg-discord-dark/20">
                    <Button
                        onClick={handleMarkAllRead}
                        disabled={markingRead}
                        className="w-full bg-discord-blurple hover:bg-discord-blurple/80 text-white font-bold"
                    >
                        {markingRead ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Marking Read...
                            </>
                        ) : (
                            "Mark All as Read"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
