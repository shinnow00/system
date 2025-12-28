"use client";

import { Hash, Plus, LogOut } from "lucide-react";
import { Department } from "./DiscordLayout";
import { Profile } from "@/types/database";

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
    setSocialFilter
}: DiscordSidebarProps) {
    return (
        <div className="flex flex-col w-60 bg-discord-sidebar flex-shrink-0">
            {/* Server Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-black/20 shadow-sm flex-shrink-0">
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
            <div className="flex-1 overflow-y-auto px-2 py-4">
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
                            return (
                                <button
                                    key={profile.id}
                                    onClick={() => {
                                        onToggleGeneralChat(false);
                                        onChannelChange(dmId);
                                    }}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors group ${isActive
                                        ? "bg-discord-item text-discord-text"
                                        : "text-discord-text-muted hover:text-discord-text hover:bg-discord-item/50"
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-medium">
                                            {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
                                        </span>
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
            <div className="h-[52px] px-2 flex items-center gap-2 bg-discord-dark/50 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                        {userProfile?.full_name?.[0]?.toUpperCase() || userProfile?.email?.[0]?.toUpperCase() || "U"}
                    </span>
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
