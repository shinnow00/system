"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Message, Profile } from "@/types/database";
import { Plus, Send, Smile, Loader2, Paperclip, Download, X } from "lucide-react";

interface ChatAreaProps {
    userProfile?: Profile | null;
    channelId?: string;
}

export default function ChatArea({ userProfile, channelId = "general" }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUserName, setOtherUserName] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabaseRef = useRef(createClient());

    // Mentions State
    const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
    const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);

    // File Upload State
    const [uploading, setUploading] = useState(false);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch initial messages and set up realtime subscription
    useEffect(() => {
        const supabase = supabaseRef.current;

        // 1. Clear old view instantly
        setMessages([]);
        setLoading(true);

        const fetchMessages = async () => {
            console.log(`DEBUG: Starting initial history fetch for ${channelId}...`);

            // Resolve Other User Name for DM
            if (channelId !== "general" && channelId.includes("_")) {
                const parts = channelId.split("_");
                const otherId = parts.find(id => id !== userProfile?.id);
                if (otherId) {
                    const { data: otherProfile } = await supabase
                        .from("profiles")
                        .select("full_name, email")
                        .eq("id", otherId)
                        .single();
                    if (otherProfile) {
                        setOtherUserName(otherProfile.full_name || otherProfile.email.split('@')[0]);
                    }
                }
            } else {
                setOtherUserName(null);
            }

            // Try with joined profiles first
            const { data, error } = await supabase
                .from("messages")
                .select(`
                    *,
                    sender:sender_id ( email, role, department, full_name )
                `)
                .eq("channel_id", channelId)
                .order("created_at", { ascending: true })
                .limit(100);

            if (error) {
                console.warn("DEBUG: Initial fetch with join failed, falling back to plain messages:", error.message);
                // Fallback: Fetch plain messages without profiles
                const { data: plainData, error: plainError } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("channel_id", channelId)
                    .order("created_at", { ascending: true })
                    .limit(100);

                if (plainError) {
                    console.error("DEBUG: Plain history fetch also failed:", plainError);
                } else {
                    console.log("DEBUG: Plain history fetched:", plainData?.length);
                    setMessages(plainData || []);
                }
            } else {
                console.log("DEBUG: Joined history fetched:", data?.length);
                setMessages(data || []);
            }
            setLoading(false);

            // Give the DOM a moment to render before scrolling
            setTimeout(scrollToBottom, 100);
        };

        const fetchProfiles = async () => {
            const { data } = await supabase.from("profiles").select("*");
            if (data) {
                // Filter OUT Super-Admin (xshinnow)
                setAvailableProfiles(data.filter(p => !p.email.includes("xshinnow")));
            }
        };

        fetchMessages();
        fetchProfiles();

        // Set up realtime subscription for this specific channel
        const channel = supabase
            .channel(`chat:${channelId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `channel_id=eq.${channelId}`,
                },
                async (payload) => {
                    console.log("DEBUG: Realtime payload received:", payload);

                    // Optimization: If it's the current user, add immediately with local profile
                    if (userProfile && payload.new.sender_id === userProfile.id) {
                        const optimisticMsg = {
                            ...payload.new,
                            sender: {
                                email: userProfile.email,
                                role: userProfile.role,
                                department: userProfile.department
                            }
                        } as any;
                        setMessages((prev) => [...prev, optimisticMsg]);
                        return;
                    }

                    // Fetch the new message with profile info
                    const { data: newMsg, error: fetchError } = await supabase
                        .from("messages")
                        .select(`
                            *,
                            sender:sender_id ( email, role, department, full_name )
                        `)
                        .eq("id", payload.new.id)
                        .single();

                    if (fetchError) {
                        console.error("DEBUG: Error fetching realtime message details:", fetchError.message);
                        setMessages((prev) => [...prev, { ...payload.new } as Message]);
                    } else if (newMsg) {
                        setMessages((prev) => [...prev, newMsg]);
                    }
                }
            )
            .subscribe();

        // Cleanup subscription on unmount or channel change
        return () => {
            console.log(`DEBUG: Cleaning up subscription for ${channelId}`);
            supabase.removeChannel(channel);
        };
    }, [channelId]);

    // Send a message
    const handleSendMessage = async (e?: React.FormEvent, customContent?: string, attachmentUrl?: string) => {
        if (e) e.preventDefault();

        const contentToSend = customContent || newMessage.trim();
        if (!contentToSend && !attachmentUrl) return;
        if (sending) return;

        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("Not authenticated");
            return;
        }

        setSending(true);

        const { error } = await supabase.from("messages").insert({
            channel_id: channelId,
            sender_id: user.id,
            content: contentToSend,
            attachment_url: attachmentUrl || null,
        });

        if (error) {
            console.error("DEBUG: Error sending message:", error);
        } else {
            console.log("DEBUG: Message inserted successfully");
            setNewMessage("");
        }

        setSending(false);
    };

    // Handle File Selection and Upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const supabase = supabaseRef.current;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `chat-files/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('chat-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('chat-files')
                .getPublicUrl(filePath);

            // Send message with file link
            await handleSendMessage(undefined, "Sent a file", publicUrl);

        } catch (error: any) {
            console.error("Upload Error:", error.message);
            alert("Failed to upload file. Make sure 'chat-files' bucket exists.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Mentions Logic
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart || 0;
        setNewMessage(val);
        setCursorPosition(pos);

        // Detect @
        const lastAtIndex = val.lastIndexOf("@", pos - 1);
        if (lastAtIndex !== -1 && (lastAtIndex === 0 || val[lastAtIndex - 1] === " ")) {
            const query = val.substring(lastAtIndex + 1, pos);
            if (!query.includes(" ")) {
                setMentionQuery(query);
                setMentionMenuOpen(true);
                return;
            }
        }
        setMentionMenuOpen(false);
    };

    const selectMention = (profile: Profile) => {
        const lastAtIndex = newMessage.lastIndexOf("@", cursorPosition - 1);
        if (lastAtIndex !== -1) {
            const before = newMessage.substring(0, lastAtIndex);
            const after = newMessage.substring(cursorPosition);
            const inserted = `@${profile.email} `;
            setNewMessage(before + inserted + after);
            setMentionMenuOpen(false);
        }
    };

    // Format timestamp
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Format date for day separators
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    // Check if we need a date separator
    const needsDateSeparator = (msg: Message, prevMsg?: Message) => {
        if (!prevMsg) return true;
        const msgDate = new Date(msg.created_at).toDateString();
        const prevDate = new Date(prevMsg.created_at).toDateString();
        return msgDate !== prevDate;
    };

    // Get user display name
    const getUserName = (msg: any) => {
        // Ensure sender is treated as an object
        const senderObj = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;

        // Priority logic: full_name > email > username > Unknown User
        const displayName = senderObj?.full_name || senderObj?.email || senderObj?.username || 'Unknown User';

        return displayName;
    };

    // Get user initial for avatar
    const getInitial = (msg: any) => {
        const name = getUserName(msg);
        return name[0]?.toUpperCase() || "?";
    };

    // Generate color from user ID
    const getAvatarColor = (senderId: string) => {
        const colors = [
            "bg-discord-blurple",
            "bg-discord-green",
            "bg-pink-500",
            "bg-orange-500",
            "bg-yellow-500",
            "bg-cyan-500",
            "bg-red-500",
            "bg-purple-500",
        ];
        const hash = senderId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-discord-blurple" size={32} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-discord-item rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <h2 className="text-xl font-bold text-discord-text mb-2">
                            Welcome to {channelId === "general" ? "#general" : `@${otherUserName || "DM"}`}!
                        </h2>
                        <p className="text-discord-text-muted max-w-md">
                            This is the start of the {channelId === "general" ? "#general" : `direct message`} conversations with {channelId === "general" ? "the team" : otherUserName || "this user"}.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg, index) => {
                            const prevMsg = messages[index - 1];
                            const showDateSeparator = needsDateSeparator(msg, prevMsg);
                            const sameUser = prevMsg?.sender_id === msg.sender_id && !showDateSeparator;
                            const timeDiff = prevMsg
                                ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
                                : Infinity;
                            const showHeader = !sameUser || timeDiff > 5 * 60 * 1000; // 5 min gap

                            return (
                                <div key={msg.id}>
                                    {/* Date Separator */}
                                    {showDateSeparator && (
                                        <div className="flex items-center gap-4 my-4">
                                            <div className="flex-1 h-px bg-discord-item" />
                                            <span className="text-xs font-semibold text-discord-text-muted px-2">
                                                {formatDate(msg.created_at)}
                                            </span>
                                            <div className="flex-1 h-px bg-discord-item" />
                                        </div>
                                    )}

                                    {/* Message */}
                                    <div
                                        className={`flex gap-4 hover:bg-discord-item/20 px-2 py-0.5 -mx-2 rounded ${showHeader ? "mt-4" : ""
                                            }`}
                                    >
                                        {/* Avatar */}
                                        {showHeader ? (
                                            <div
                                                className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${getAvatarColor(
                                                    msg.sender_id
                                                )}`}
                                            >
                                                <span className="text-white font-medium">{getInitial(msg)}</span>
                                            </div>
                                        ) : (
                                            <div className="w-10 flex-shrink-0" />
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {showHeader && (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-discord-text hover:underline cursor-pointer">
                                                        {getUserName(msg)}
                                                    </span>
                                                    <span className="text-xs text-discord-text-muted">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            )}
                                            <p className="text-discord-text break-words">{msg.content}</p>

                                            {/* Attachment Rendering */}
                                            {msg.attachment_url && (
                                                <div className="mt-2 p-3 bg-discord-dark rounded-md border border-white/5 flex items-center gap-3 w-fit max-w-full">
                                                    <div className="w-10 h-10 bg-discord-bg rounded flex items-center justify-center text-discord-text-muted">
                                                        <Paperclip size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-discord-text truncate">
                                                            {msg.attachment_url.split('/').pop()?.split('?')[0] || "File Attachment"}
                                                        </p>
                                                        <a
                                                            href={msg.attachment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-discord-blurple hover:underline flex items-center gap-1 mt-0.5"
                                                        >
                                                            <Download size={12} />
                                                            Download File
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="px-4 pb-6">
                <form onSubmit={handleSendMessage} className="relative">
                    {/* Mentions Popover */}
                    {mentionMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-discord-dark border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                            <div className="p-2 border-b border-white/5 bg-discord-bg">
                                <span className="text-[10px] font-bold text-discord-text-muted uppercase tracking-wider">
                                    Mention User
                                </span>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {availableProfiles
                                    .filter(p => p.email.toLowerCase().includes(mentionQuery.toLowerCase()))
                                    .map(profile => (
                                        <button
                                            key={profile.id}
                                            type="button"
                                            onClick={() => selectMention(profile)}
                                            className="w-full flex items-center gap-2 p-2 hover:bg-discord-blurple/20 group transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-discord-item flex items-center justify-center text-xs font-bold text-discord-text">
                                                {profile.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-discord-text truncate group-hover:text-white">
                                                    {profile.email}
                                                </p>
                                                <p className="text-[10px] text-discord-text-muted truncate">
                                                    {profile.role}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                {availableProfiles.filter(p => p.email.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
                                    <div className="p-4 text-center text-xs text-discord-text-muted">
                                        No users found
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-discord-item rounded-lg px-4 py-2.5">
                        {/* Plus Button with File Upload */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-discord-text-muted hover:bg-discord-text transition-colors disabled:opacity-50"
                        >
                            {uploading ? (
                                <Loader2 size={16} className="text-discord-bg animate-spin" />
                            ) : (
                                <Plus size={16} className="text-discord-bg" />
                            )}
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Text Input */}
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder={channelId === "general" ? "Message #general" : `Message @${otherUserName || "User"}`}
                            className="flex-1 bg-transparent text-discord-text placeholder-discord-text-muted focus:outline-none"
                            disabled={sending}
                        />

                        {/* Emoji Button */}
                        <button
                            type="button"
                            className="text-discord-text-muted hover:text-discord-text transition-colors"
                        >
                            <Smile size={22} />
                        </button>

                        {/* Send Button (visible when typing) */}
                        {newMessage.trim() && (
                            <button
                                type="submit"
                                disabled={sending}
                                className="text-discord-blurple hover:text-discord-blurple/80 transition-colors"
                            >
                                {sending ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
