import { Home, Users, Truck, Cog, Shield, Instagram, Briefcase, Calculator } from "lucide-react";

// Department type
export type Department = "design" | "social" | "accounts" | "hr" | "ops" | "superadmin" | "home" | "finance";

// Department icons for the server rail
export const departments: { id: Department; icon: typeof Home; name: string; color: string }[] = [
    { id: "design", icon: Users, name: "Designers", color: "bg-discord-green" },
    { id: "social", icon: Instagram, name: "Social Media", color: "bg-pink-500" },
    { id: "accounts", icon: Briefcase, name: "Account Managers", color: "bg-orange-500" },
    { id: "hr", icon: Cog, name: "HR Department", color: "bg-blue-500" },
    { id: "ops", icon: Truck, name: "Operations", color: "bg-yellow-600" },
    { id: "finance", icon: Calculator, name: "Finance & Inventory", color: "bg-emerald-600" },
];

// Channels config per department
export const channelsByDepartment: Record<Department, { id: string; name: string; type: "text" | "voice" }[]> = {
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
    finance: [
        { id: "payments", name: "payments", type: "text" },
        { id: "sales", name: "sales", type: "text" },
        { id: "inventory", name: "inventory", type: "text" },
    ],
    home: [],
};

export const departmentTitles: Record<Department, string> = {
    design: "Design Team",
    social: "Social Media",
    accounts: "Account Management",
    hr: "HR Department",
    ops: "Operations",
    superadmin: "Super Admin",
    finance: "Finance & Inventory",
    home: "Direct Messages",
};

export const ROLES_BY_DEPARTMENT: Record<string, string[]> = {
    "Designers": ["2D Designer", "3D Designer", "Motion Designer", "Visual Manager"],
    "Social": ["Social Media Specialist"],
    "Account Managers": ["Account Manager"],
    "Hr": ["HR Specialist"],
    "Operations": ["Operations Manager", "Operator"],
    "Finance & Inventory": ["Accountant"],
    "SuperAdmin": ["Admin", "Super-Admin"]
};
