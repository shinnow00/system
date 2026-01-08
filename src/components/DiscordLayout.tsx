"use client";

import { Hash } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { Profile } from "@/types/database";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import DiscordSidebar from "./DiscordSidebar";
import ServerRail from "./ServerRail";
import MobileNav from "./MobileNav";
import { Department, departments, channelsByDepartment, departmentTitles } from "@/utils/departments";

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
    socialFilter?: string;
    setSocialFilter?: (filter: string) => void;
    hrFilter?: string;
    setHrFilter?: (filter: any) => void;
    financeFilter?: string;
    setFinanceFilter?: (filter: any) => void;
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
    onChannelChange,
    socialFilter = 'calendar',
    setSocialFilter = () => { },
    hrFilter = 'attendance',
    setHrFilter = () => { },
    financeFilter = 'payments',
    setFinanceFilter = () => { },
}: DiscordLayoutProps) {
    const channels = channelsByDepartment[activeDepartment as keyof typeof channelsByDepartment] || [];
    const activeChannelId = channels[0]?.id || "general";
    const router = useRouter();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [headerOtherName, setHeaderOtherName] = useState<string | null>(null);

    useEffect(() => {
        if (activeDepartment === "home") {
            const fetchProfiles = async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .neq("role", "Super-Admin");
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

    useEffect(() => {
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

    const currentChannelName = currentActiveChannelId === "general"
        ? "general-chat"
        : headerOtherName
            ? `@${headerOtherName}`
            : currentActiveChannelId || "";

    return (
        <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
            {/* Mobile Navigation */}
            <MobileNav
                currentChannelName={currentChannelName}
                activeDepartment={activeDepartment}
                onDepartmentChange={onDepartmentChange}
                isShadow={isShadow}
                userProfile={userProfile}
                departmentTitles={departmentTitles}
                onCreateTask={onCreateTask}
                isGeneralChat={isGeneralChat}
                onToggleGeneralChat={onToggleGeneralChat || (() => { })}
                currentActiveChannelId={currentActiveChannelId || 'general'}
                onChannelChange={onChannelChange || (() => { })}
                channels={channels}
                profiles={profiles}
                getDmId={getDmId}
                handleLogout={handleLogout}
                socialFilter={socialFilter}
                setSocialFilter={setSocialFilter}
                hrFilter={hrFilter}
                setHrFilter={setHrFilter}
                financeFilter={financeFilter}
                setFinanceFilter={setFinanceFilter}
            />

            {/* Desktop: Server Rail - Left side icons - Hidden on Mobile */}
            <div className="hidden md:flex flex-col flex-shrink-0">
                <ServerRail
                    activeDepartment={activeDepartment}
                    onDepartmentChange={onDepartmentChange}
                    isShadow={isShadow}
                    userProfile={userProfile}
                />
            </div>

            {/* Desktop Channel Sidebar - Hidden on Mobile */}
            <div className="hidden md:flex flex-col flex-shrink-0">
                <DiscordSidebar
                    activeDepartment={activeDepartment}
                    departmentTitles={departmentTitles}
                    onCreateTask={onCreateTask}
                    isGeneralChat={isGeneralChat}
                    onToggleGeneralChat={onToggleGeneralChat || (() => { })}
                    currentActiveChannelId={currentActiveChannelId || 'general'}
                    onChannelChange={onChannelChange || (() => { })}
                    channels={channels}
                    profiles={profiles}
                    getDmId={getDmId}
                    userProfile={userProfile}
                    handleLogout={handleLogout}
                    socialFilter={socialFilter}
                    setSocialFilter={setSocialFilter}
                    hrFilter={hrFilter}
                    setHrFilter={setHrFilter}
                    financeFilter={financeFilter}
                    setFinanceFilter={setFinanceFilter}
                />
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
