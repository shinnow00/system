"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import ServerRail from "./ServerRail";
import DiscordSidebar from "./DiscordSidebar";
import { Department } from "@/utils/departments";
import { Profile } from "@/types/database";

interface MobileNavProps {
    activeDepartment: Department;
    onDepartmentChange: (dept: Department) => void;
    isShadow?: boolean;
    userProfile?: Profile | null;
    currentChannelName: string;
    // Sidebar props
    departmentTitles: Record<Department, string>;
    onCreateTask?: () => void;
    isGeneralChat: boolean;
    onToggleGeneralChat: (isOpen: boolean) => void;
    currentActiveChannelId: string;
    onChannelChange: (id: string) => void;
    channels: any[];
    profiles: any[];
    getDmId: (id: string) => string;
    handleLogout: () => void;
    socialFilter: string;
    setSocialFilter: (filter: string) => void;
    hrFilter: string;
    setHrFilter: (filter: string) => void;
}

export default function MobileNav({
    currentChannelName,
    activeDepartment,
    onDepartmentChange,
    isShadow,
    userProfile,
    // Sidebar props
    departmentTitles,
    onCreateTask,
    isGeneralChat,
    onToggleGeneralChat,
    currentActiveChannelId,
    onChannelChange,
    channels,
    profiles,
    getDmId,
    handleLogout,
    socialFilter,
    setSocialFilter,
    hrFilter,
    setHrFilter
}: MobileNavProps) {
    return (
        <div className="md:hidden h-14 bg-discord-dark border-b border-black/20 flex items-center px-4 justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="text-discord-text hover:text-white transition-colors">
                            <Menu size={24} />
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="p-0 flex gap-0 bg-discord-dark border-discord-dark text-discord-text w-[320px]"
                    >
                        <div className="w-[72px] flex-shrink-0 h-full">
                            <ServerRail
                                activeDepartment={activeDepartment}
                                onDepartmentChange={onDepartmentChange}
                                isShadow={isShadow}
                                userProfile={userProfile}
                            />
                        </div>
                        <div className="flex-1 min-w-0 h-full">
                            <DiscordSidebar
                                activeDepartment={activeDepartment}
                                departmentTitles={departmentTitles}
                                onCreateTask={onCreateTask}
                                isGeneralChat={isGeneralChat}
                                onToggleGeneralChat={onToggleGeneralChat}
                                currentActiveChannelId={currentActiveChannelId}
                                onChannelChange={onChannelChange}
                                channels={channels}
                                profiles={profiles}
                                getDmId={getDmId}
                                userProfile={userProfile}
                                handleLogout={handleLogout}
                                socialFilter={socialFilter}
                                setSocialFilter={setSocialFilter}
                                hrFilter={hrFilter}
                                setHrFilter={setHrFilter}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
                <h2 className="font-semibold text-discord-text truncate">
                    {currentChannelName}
                </h2>
            </div>
        </div>
    );
}
