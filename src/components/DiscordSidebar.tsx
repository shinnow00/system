"use client";

import { useState, useEffect } from "react";
import { Hash, Plus, LogOut } from "lucide-react";
import { Department } from "@/utils/departments";
import { Profile } from "@/types/database";
import { createClient } from "@/utils/supabase/client";

interface DiscordSidebarProps {
    activeDepartment: Department;
    departmentTitles: Record<Department, string>;
    onCreateTask?: () => void;
    isGeneralChat: boolean;
    onToggleGeneralChat: (isOpen: boolean) => void;
    currentActiveChannelId: string;
    onChannelChange: (id: string) => void;
    channels: { id: string; name: string; type: "text" | "voice" }[];
    profiles: any[];
    getDmId: (userId: string) => string;
    userProfile?: Profile | null;
    handleLogout: () => void;
    socialFilter: string;
    setSocialFilter: (filter: string) => void;
    hrFilter?: string;
    setHrFilter?: (filter: any) => void;
    financeFilter?: string;
    setFinanceFilter?: (filter: any) => void;
    opsFilter?: string;
    setOpsFilter?: (filter: any) => void;
}

export default function DiscordSidebar({
    activeDepartment,
    departmentTitles,
    onCreateTask,
    isGeneralChat,
    onToggleGeneralChat,
    currentActiveChannelId,
    onChannelChange,
    channels,
    profiles,
    getDmId,
    userProfile,
    handleLogout,
    socialFilter,
    setSocialFilter,
    hrFilter,
    setHrFilter,
    financeFilter,
    setFinanceFilter,
    opsFilter,
    setOpsFilter
}: DiscordSidebarProps) {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [unreadChannels, setUnreadChannels] = useState<Set<string>>(new Set());

    // Presence listener
    useEffect(() => {
        if (!userProfile) return;

        const supabase = createClient();
        const channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: userProfile.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const onlineIds = new Set(Object.keys(newState));
                setOnlineUsers(onlineIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                        user_id: userProfile.id,
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile]);

    // Unread messages listener
    useEffect(() => {
        if (!userProfile) return;

        const supabase = createClient();
        const channel = supabase
            .channel('sidebar-unread-notifier')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new;
                if (newMsg.channel_id !== currentActiveChannelId && newMsg.sender_id !== userProfile.id) {
                    setUnreadChannels(prev => {
                        const next = new Set(prev);
                        next.add(newMsg.channel_id);
                        return next;
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userProfile, currentActiveChannelId]);

    // Clear unread logic
    useEffect(() => {
        if (currentActiveChannelId && unreadChannels.has(currentActiveChannelId)) {
            setUnreadChannels(prev => {
                const next = new Set(prev);
                next.delete(currentActiveChannelId);
                return next;
            });
        }
    }, [currentActiveChannelId, unreadChannels]);

    return (
        <div className="flex flex-col w-60 !bg-[#2B2D31] flex-shrink-0 h-full">
            {/* Server Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-black/20 shadow-sm flex-shrink-0 !bg-[#2B2D31]">
                <h2 className="font-semibold text-discord-text truncate flex-1">
                    {departmentTitles[activeDepartment]}
                </h2>
                {onCreateTask && activeDepartment !== "superadmin" && (
                    <button
                        onClick={onCreateTask}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-discord-item transition-colors text-discord-text-muted hover:text-discord-text"
                        title="Create Task"
                    >
                        <Plus size={18} />
                    </button>
                )}
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto px-2 py-4 !bg-[#2B2D31]">
                {/* General Chat Link */}
                <button
                    onClick={() => {
                        onToggleGeneralChat(true);
                        onChannelChange("general");
                    }}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 mb-2 rounded text-left transition-colors ${isGeneralChat || currentActiveChannelId === "general"
                        ? "bg-discord-item text-discord-text"
                        : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                        }`}
                >
                    <Hash size={20} className="flex-shrink-0 text-discord-text-muted" />
                    <span className="truncate text-sm font-medium"># General Chat</span>
                </button>

                <div className="h-px bg-discord-item mx-2 my-2 opacity-30" />

                {activeDepartment === "home" ? (
                    /* DM List */
                    <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs font-semibold text-discord-text-muted uppercase tracking-wide mb-1 px-1">
                            Direct Messages
                        </div>
                        {profiles.map((profile: any) => {
                            const dmId = getDmId(profile.id);
                            const isActive = currentActiveChannelId === dmId;
                            const isUnread = unreadChannels.has(dmId);

                            return (
                                <button
                                    key={profile.id}
                                    onClick={() => {
                                        onToggleGeneralChat(false);
                                        onChannelChange(dmId);
                                    }}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors group ${isActive
                                        ? "bg-discord-item text-discord-text"
                                        : isUnread
                                            ? "bg-discord-item text-white font-bold"
                                            : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                                        }`}
                                >
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white text-xs font-medium">
                                                    {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2B2D31] transition-colors duration-300 ${onlineUsers.has(profile.id) ? "bg-emerald-500" : "bg-gray-500"
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {profile.full_name || profile.email.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] text-discord-text-muted truncate group-hover:text-discord-text">
                                            {profile.email}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : activeDepartment === 'social' ? (
                    /* Social Channels */
                    <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs font-semibold text-discord-text-muted uppercase tracking-wide mb-1 px-1">
                            Navigation
                        </div>
                        {['calendar', 'shooting', 'meta-ads'].map((id) => {
                            const isActive = socialFilter === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => {
                                        onToggleGeneralChat(false);
                                        setSocialFilter(id);
                                        onChannelChange(id);
                                    }}
                                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors ${isActive
                                        ? "bg-discord-item text-discord-text"
                                        : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                                        }`}
                                >
                                    <Hash size={20} className="flex-shrink-0 text-discord-text-muted" />
                                    <span className="truncate text-sm"># {id}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : activeDepartment === 'hr' ? (
                    <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs font-semibold text-discord-text-muted uppercase tracking-wide mb-1 px-1">
                            HR Module
                        </div>
                        {[
                            { id: 'attendance', name: 'Attendance' },
                            { id: 'employees', name: 'Employees' },
                            { id: 'database', name: 'Database' }
                        ].map((channel) => {
                            const isActive = hrFilter === channel.id;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => {
                                        onToggleGeneralChat(false);
                                        if (setHrFilter) setHrFilter(channel.id);
                                        onChannelChange(channel.id);
                                    }}
                                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors ${isActive
                                        ? "bg-discord-item text-discord-text"
                                        : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                                        }`}
                                >
                                    <Hash size={20} className="flex-shrink-0 text-discord-text-muted" />
                                    <span className="truncate text-sm"># {channel.name.toLowerCase()}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : activeDepartment === 'finance' ? (
                    <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs font-semibold text-discord-text-muted uppercase tracking-wide mb-1 px-1">
                            Finance & Inventory
                        </div>
                        {[
                            { id: 'payments', name: 'Payments' },
                            { id: 'sales', name: 'Sales' },
                            { id: 'paid-collected', name: 'Paid-Collected' },
                            { id: 'inventory', name: 'Inventory' }
                        ].map((channel) => {
                            const isActive = financeFilter === channel.id;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => {
                                        onToggleGeneralChat(false);
                                        if (setFinanceFilter) setFinanceFilter(channel.id);
                                        onChannelChange(channel.id);
                                    }}
                                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors ${isActive
                                        ? "bg-discord-item text-discord-text"
                                        : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                                        }`}
                                >
                                    <Hash size={20} className="flex-shrink-0 text-discord-text-muted" />
                                    <span className="truncate text-sm"># {channel.name.toLowerCase()}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : activeDepartment === 'ops' ? (
                    <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs font-semibold text-discord-text-muted uppercase tracking-wide mb-1 px-1">
                            Operations Control
                        </div>
                        {[
                            { id: 'tracking', name: 'Tracking' },
                            { id: 'quotations', name: 'Quotations' }
                        ].map((channel) => {
                            const isActive = opsFilter === channel.id;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => {
                                        onToggleGeneralChat(false);
                                        if (setOpsFilter) setOpsFilter(channel.id);
                                        onChannelChange(channel.id);
                                    }}
                                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors ${isActive
                                        ? "bg-discord-item text-discord-text"
                                        : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                                        }`}
                                >
                                    <Hash size={20} className="flex-shrink-0 text-discord-text-muted" />
                                    <span className="truncate text-sm"># {channel.name.toLowerCase()}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* Navigation Category (Department specific) */
                    <div className="mb-4">
                        <button className="flex items-center gap-1 text-xs font-semibold text-discord-text-muted uppercase tracking-wide mb-1 px-1 hover:text-discord-text transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" className="fill-current">
                                <path d="M7 10l5 5 5-5H7z" />
                            </svg>
                            Navigation
                        </button>
                        {channels
                            .filter((c) => c.type === "text")
                            .map((channel) => {
                                const isActive = !isGeneralChat && currentActiveChannelId === channel.id;
                                return (
                                    <button
                                        key={channel.id}
                                        onClick={() => {
                                            onToggleGeneralChat(false);
                                            onChannelChange(channel.id);
                                        }}
                                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors ${isActive
                                            ? "bg-discord-item text-discord-text"
                                            : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                                            }`}
                                    >
                                        <Hash size={20} className="flex-shrink-0 text-discord-text-muted" />
                                        <span className="truncate text-sm">{channel.name}</span>
                                    </button>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* User Panel */}
            <div className="h-[52px] px-2 flex items-center gap-2 flex-shrink-0 !bg-[#2B2D31]">
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white text-sm font-medium">
                            {userProfile?.full_name?.[0]?.toUpperCase() || userProfile?.email?.[0]?.toUpperCase() || "U"}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-discord-text truncate">
                        {userProfile?.full_name || userProfile?.email?.split("@")[0] || "User"}
                    </p>
                    <p className="text-xs text-discord-text-muted truncate">
                        {userProfile?.role || "Online"}
                    </p>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={handleLogout}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-discord-item transition-colors flex-shrink-0"
                        title="Sign Out"
                    >
                        <LogOut size={18} className="text-discord-text-muted" />
                    </button>
                </div>
            </div>
        </div>
    );
}
