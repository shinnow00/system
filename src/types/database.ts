// Database types for the application

export interface Profile {
    id: string;
    email: string;
    full_name?: string | null;
    role: "2D Designer" | "3D Designer" | "Motion Designer" | "Visual Manager" | "Social Media Specialist" | "Account Manager" | "Operations Manager" | "Operator" | "Accountant" | "HR Specialist" | "Admin" | "Super-Admin" | null;
    department: "Designers" | "Social" | "Account Managers" | "Hr" | "Operations" | "Finance & Inventory" | "SuperAdmin" | null;
    avatar_url: string | null;
    salary?: number | null;
    created_at: string;
    updated_at: string;
}

export interface Attendance {
    id: string;
    // user_id: string; // Deprecated in favor of personnel_id
    personnel_id?: string;
    status: "Present" | "Absent" | "Late";
    bonus: number;
    deduction: number;
    deduction_amount?: number;
    deduction_reason?: string;
    date: string;
    created_at: string;
    // Joined from personnel
    personnel?: {
        full_name: string;
    };
    // Legacy join (optional)
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
    assignee?: {
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
    meta_data?: Record<string, any> | null;
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

export interface Personnel {
    id: string;
    full_name: string;
    job_title: string;
    phone_number: string;
    national_id: string;
    qualification: string;
    insurance_status: "Insured" | "Social Insurance" | "None" | "Pending";
    notes?: string;
    profile_id?: string | null;
    start_date?: string | null;
    annual_balance?: number | null;
    salary?: number | null;
    created_at: string;
    updated_at: string;
    // Joined
    profile?: {
        email: string;
        full_name: string | null;
    };
}
