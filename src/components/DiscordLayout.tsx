"use client";

import { Home, Hash, Users, Truck, Plus, Cog, Shield, Instagram, Briefcase, LogOut } from "lucide-react";
import { ReactNode } from "react";
import { Profile } from "@/types/database";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// Department type
export type Department = "design" | "social" | "accounts" | "hr" | "ops" | "superadmin" | "home";

// Department icons for the server rail
const departments: { id: Department; icon: typeof Home; name: string; color: string }[] = [
    { id: "design", icon: Users, name: "Designers", color: "bg-discord-green" },
    { id: "social", icon: Instagram, name: "Social Media", color: "bg-pink-500" },
    { id: "accounts", icon: Briefcase, name: "Account Managers", color: "bg-orange-500" },
    { id: "hr", icon: Cog, name: "HR Department", color: "bg-blue-500" },
    { id: "ops", icon: Truck, name: "Operations", color: "bg-yellow-600" },
];

// Channels config per department
const channelsByDepartment: Record<Department, { id: string; name: string; type: "text" | "voice" }[]> = {
    design: [
        { id: "my-tasks", name: "my-tasks", type: "text" },
        { id: "team-board", name: "team-board", type: "text" },
        { id: "completed", name: "completed", type: "text" },
    ],
    social: [
        { id: "calendar", name: "calendar", type: "text" },
        { id: "content-grid", name: "content-grid", type: "text" },
        { id: "analytics", name: "analytics", type: "text" },
    ],
    accounts: [
        { id: "clients", name: "clients", type: "text" },
        { id: "deals", name: "deals", type: "text" },
    ],
    hr: [
        { id: "attendance", name: "attendance", type: "text" },
        { id: "payroll", name: "payroll", type: "text" },
    ],
    ops: [
        { id: "tracking", name: "tracking", type: "text" },
        { id: "logistics", name: "logistics", type: "text" },
    ],
    superadmin: [
        { id: "user-management", name: "user-management", type: "text" },
        { id: "system-logs", name: "system-logs", type: "text" },
    ],
    home: [],
};

const departmentTitles: Record<Department, string> = {
    design: "Design Team",
    social: "Social Media",
    accounts: "Account Management",
    hr: "HR Department",
    ops: "Operations",
    superadmin: "Super Admin",
    home: "Direct Messages",
};

interface DiscordLayoutProps {
    children: ReactNode;
    activeDepartment: Department;
    onDepartmentChange: (dept: Department) => void;
    isShadow?: boolean;
    userProfile?: Profile | null;
    onCreateTask?: () => void;
    isGeneralChat?: boolean;
    onToggleGeneralChat?: (isOpen: boolean) => void;
    activeChannel?: string;
    onChannelChange?: (id: string) => void;
}

export default function DiscordLayout({
    children,
    activeDepartment,
    onDepartmentChange,
    isShadow = false,
    userProfile,
    onCreateTask,
    isGeneralChat = false,
    onToggleGeneralChat,
    activeChannel: currentActiveChannelId,
    onChannelChange
}: DiscordLayoutProps) {
    const channels = channelsByDepartment[activeDepartment as keyof typeof channelsByDepartment] || [];
    const activeChannel = channels[0]?.id || "general";
    const router = useRouter();
    const [profiles, setProfiles] = (require("react").useState)([]);
    const [headerOtherName, setHeaderOtherName] = (require("react").useState)(null);

    require("react").useEffect(() => {
        if (activeDepartment === "home") {
            const fetchProfiles = async () => {
                const supabase = createClient();
                const { data } = await supabase.from("profiles").select("*");
                if (data) {
                    setProfiles(data.filter((p: any) =>
                        p.email !== "xshinnow@x.com" &&
                        p.email !== "xshinnow" &&
                        p.id !== userProfile?.id
                    ));
                }
            };
            fetchProfiles();
        }
    }, [activeDepartment, userProfile?.id]);

    require("react").useEffect(() => {
        if (activeDepartment === "home" && currentActiveChannelId !== "general" && currentActiveChannelId?.includes("_")) {
            const parts = currentActiveChannelId.split("_");
            const otherId = parts.find(id => id !== userProfile?.id);
            if (otherId) {
                const fetchOther = async () => {
                    const supabase = createClient();
                    const { data } = await supabase.from("profiles").select("full_name").eq("id", otherId).single();
                    if (data) setHeaderOtherName(data.full_name);
                };
                fetchOther();
            }
        } else {
            setHeaderOtherName(null);
        }
    }, [activeDepartment, currentActiveChannelId, userProfile?.id]);

    const getDmId = (userId: string) => {
        if (!userProfile?.id) return "error";
        return [userProfile.id, userId].sort().join('_');
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden">
            {/* Server Rail - Left side icons */}
            <div className="flex flex-col items-center w-[72px] bg-discord-dark py-3 gap-2 flex-shrink-0">
                {/* Custom Home Button Logo */}
                <button
                    onClick={() => onDepartmentChange("home")}
                    className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-2 hover:rounded-xl transition-all duration-200 group overflow-hidden ${activeDepartment === "home" ? "rounded-xl" : "rounded-2xl"}`}
                >
                    <img src="/logo.svg" alt="Ultimate" className="w-10 h-10 object-contain" />
                </button>

                {/* Separator */}
                <div className="w-8 h-0.5 bg-discord-sidebar rounded-full mb-1" />

                {/* Department Icons */}
                {departments
                    .filter((dept) => {
                        // Admin and Shadow users see all departments
                        if (userProfile?.role === "Admin" || isShadow) return true;
                        // Others only see their own department
                        const deptIdMap: Record<string, Department> = {
                            'Designers': 'design',
                            'Social Media': 'social',
                            'Account Managers': 'accounts',
                            'Hr': 'hr',
                            'Operations': 'ops'
                        };
                        const userDeptId = userProfile?.department ? (deptIdMap[userProfile.department] || userProfile.department) : null;
                        return dept.id === userDeptId;
                    })
                    .map((dept) => {
                        const Icon = dept.icon;
                        const isActive = activeDepartment === dept.id;
                        return (
                            <div key={dept.id} className="relative group">
                                {/* Active indicator pill */}
                                <div
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1 bg-white rounded-r-full transition-all duration-200 ${isActive ? "h-10" : "h-0 group-hover:h-5"
                                        }`}
                                />
                                <button
                                    onClick={() => onDepartmentChange(dept.id)}
                                    className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${isActive
                                        ? `${dept.color} rounded-xl`
                                        : "bg-discord-bg rounded-3xl hover:rounded-xl hover:bg-discord-blurple"
                                        }`}
                                    title={dept.name}
                                >
                                    <Icon size={24} className="text-discord-text" />
                                </button>
                            </div>
                        );
                    })}



                {/* Spacer to push Shadow Admin to bottom */}
                <div className="flex-1" />

                {/* Shadow Admin Icon - Only visible if isShadow is true */}
                {isShadow && (
                    <>
                        <div className="w-8 h-0.5 bg-discord-sidebar rounded-full mb-1" />
                        <div className="relative group">
                            <div
                                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1 bg-white rounded-r-full transition-all duration-200 ${activeDepartment === "superadmin" ? "h-10" : "h-0 group-hover:h-5"
                                    }`}
                            />
                            <button
                                onClick={() => onDepartmentChange("superadmin")}
                                className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${activeDepartment === "superadmin"
                                    ? "bg-red-500 rounded-xl"
                                    : "bg-discord-bg rounded-3xl hover:rounded-xl hover:bg-red-500"
                                    }`}
                                title="Super Admin"
                            >
                                <Shield size={24} className="text-discord-text" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Channel Sidebar */}
            <div className="flex flex-col w-60 bg-discord-sidebar flex-shrink-0">
                {/* Server Header */}
                <div className="h-12 px-4 flex items-center justify-between border-b border-black/20 shadow-sm">
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
                    {/* General Chat Link (Always available or only in Home?) - User said "At the very top of the DM User List, add a static entry: # General" */}
                    <button
                        onClick={() => {
                            onToggleGeneralChat?.(true);
                            onChannelChange?.("general");
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
                                            onToggleGeneralChat?.(false);
                                            onChannelChange?.(dmId);
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
                                                onToggleGeneralChat?.(false);
                                                onChannelChange?.(channel.id);
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
                <div className="h-[52px] px-2 flex items-center gap-2 bg-discord-dark/50">
                    <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center">
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
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-discord-item transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={18} className="text-discord-text-muted" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 bg-discord-bg min-w-0">
                {/* Channel Header */}
                <div className="h-12 px-4 flex items-center gap-2 border-b border-black/20 shadow-sm flex-shrink-0">
                    <Hash size={24} className="text-discord-text-muted" />
                    <h3 className="font-semibold text-discord-text">
                        {currentActiveChannelId === "general" ? "general-chat" : headerOtherName ? `@${headerOtherName}` : currentActiveChannelId}
                    </h3>
                    <div className="h-6 w-px bg-discord-text-muted/30 mx-2" />
                    <p className="text-sm text-discord-text-muted truncate">
                        {currentActiveChannelId === "general" ? "Global Team Chat" : activeDepartment === "home" ? "Private Conversation" : `${departmentTitles[activeDepartment]} workspace`}
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
