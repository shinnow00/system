"use client";

import { Home, Users, Truck, Cog, Shield, Instagram, Briefcase } from "lucide-react";
import { Department, departments } from "@/utils/departments";
import { Profile } from "@/types/database";

interface ServerRailProps {
    activeDepartment: Department;
    onDepartmentChange: (dept: Department) => void;
    isShadow?: boolean;
    userProfile?: Profile | null;
}

export default function ServerRail({
    activeDepartment,
    onDepartmentChange,
    isShadow = false,
    userProfile,
}: ServerRailProps) {
    return (
        <div className="flex flex-col items-center w-[72px] bg-discord-dark py-3 gap-2 flex-shrink-0 h-full">
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
                        'Operations': 'ops',
                        'Finance & Inventory': 'finance'
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
    );
}
