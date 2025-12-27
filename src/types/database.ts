// Database types for the application

export interface Profile {
    id: string;
    email: string;
    full_name?: string | null;
    role: "Designer" | "Visual Manager" | "Social Media Manager" | "Account Manager" | "Admin";
    department: "Designers" | "Social" | "Account Managers" | "Hr" | "Operations";
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Attendance {
    id: string;
    employee_id: string;
    status: "Present" | "Absent" | "Late";
    bonus: number;
    deduction: number;
    date: string;
    created_at: string;
    // Joined from profiles
    profiles?: {
        full_name?: string | null;
        email: string;
    };
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: "Todo" | "In Progress" | "Done";
    department: "Designers" | "Social" | "Account Managers" | "Hr" | "Operations";
    assigned_to?: string | null;
    created_by: string;
    deadline: string | null;
    meta_data: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    task_parts?: TaskPart[];
    creator?: {
        full_name: string | null;
    };
}

export interface TaskPart {
    id: string;
    task_id: string;
    title: string;
    designer_checked: boolean;
    manager_approved: boolean;
    checked_by: string | null;
    approved_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    attachment_url?: string | null;
    created_at: string;
    // Joined from profiles
    sender?: {
        email: string;
        role: string;
        department: string;
        full_name: string | null;
        avatar_url: string | null;
    };
    creator?: {
        full_name: string | null;
    };
    // Fallback for some existing code
    profiles?: {
        full_name?: string | null;
        email: string;
        avatar_url: string | null;
    };
}
