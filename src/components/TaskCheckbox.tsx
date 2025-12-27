"use client";

import { useState } from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { TaskPart } from "@/types/database";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

interface TaskCheckboxProps {
    part: TaskPart;
    onUpdate?: (updatedPart: TaskPart) => void;
}

const MANAGER_ROLES = ['Visual Manager', 'Admin', 'Super-Admin'];

export default function TaskCheckbox({ part, onUpdate }: TaskCheckboxProps) {
    const { user } = useUser();
    const [updating, setUpdating] = useState(false);
    const router = useRouter();

    if (!user) return null; // Safety check

    console.log("REAL DB ROLE:", user.role);
    console.log("Is Manager?", MANAGER_ROLES.includes(user.role));

    const handleCheck = async () => {
        if (updating) return;

        console.log("Clicking part:", part.id); // Debug Log
        setUpdating(true);

        const isManager = MANAGER_ROLES.includes(user.role);
        const updates: any = {};

        if (isManager) {
            // MANAGER: Toggle Green State
            // If currently approved, reset EVERYTHING.
            // If not approved, set EVERYTHING to true.
            if (part.manager_approved) {
                updates.manager_approved = false;
                updates.designer_checked = false;
            } else {
                updates.manager_approved = true;
                updates.designer_checked = true;
            }
        } else {
            // DESIGNER: Toggle Blue State Only
            // Strict Rule: NEVER touch manager_approved
            updates.designer_checked = !part.designer_checked;
        }

        const supabase = createClient();

        const { error: updateError } = await supabase
            .from('task_parts')
            .update(updates)
            .eq('id', part.id);

        if (updateError) {
            console.error("Supabase Error:", updateError.message);
            setUpdating(false);
            return;
        }

        const { data: allParts, error: partsError } = await supabase
            .from('task_parts')
            .select('designer_checked, manager_approved')
            .eq('task_id', part.task_id);

        if (partsError) {
            console.error("Error fetching all parts:", partsError.message);
        } else if (allParts) {
            // Use manager_approved for determining the final status
            const allChecked = allParts.every(p => p.manager_approved === true || p.designer_checked === true);
            const parentStatus = allChecked ? 'Done' : 'Todo';

            const { error: taskError } = await supabase
                .from('tasks')
                .update({ status: parentStatus, updated_at: new Date().toISOString() })
                .eq('id', part.task_id);

            if (taskError) {
                console.error("Error updating parent task status:", taskError.message);
            }
        }

        onUpdate?.({ ...part, ...updates });
        router.refresh();
        setUpdating(false);
    };

    // Get checkbox styling based on state
    const getCheckboxColor = () => {
        if (part.manager_approved) return 'bg-discord-green border-discord-green'; // Fully Done
        if (part.designer_checked) return 'bg-discord-blurple border-discord-blurple'; // Pending Review
        return 'bg-transparent border-discord-text-muted hover:border-discord-text'; // Empty
    };

    return (
        <button
            onClick={handleCheck}
            disabled={updating}
            className="w-full flex items-center gap-3 p-2 rounded hover:bg-discord-item/50 transition-colors text-left group"
        >
            {/* Custom Checkbox */}
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${getCheckboxColor()}`}>
                {updating ? (
                    <Loader2 size={12} className="text-white animate-spin" />
                ) : (
                    (part.designer_checked || part.manager_approved) && (
                        <CheckSquare size={14} className="text-white" strokeWidth={3} />
                    )
                )}
            </div>

            {/* Part Title */}
            <span
                className={`text-sm flex-1 transition-colors ${part.manager_approved
                    ? "text-discord-text-muted line-through"
                    : part.designer_checked
                        ? "text-discord-text"
                        : "text-discord-text-muted group-hover:text-discord-text"
                    }`}
            >
                {part.title}
            </span>

            {/* Status Indicators */}
            <div className="flex gap-1.5 flex-shrink-0">
                {part.designer_checked && !part.manager_approved && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-discord-blurple/20 text-discord-blurple">
                        Awaiting
                    </span>
                )}
                {part.manager_approved && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-discord-green/20 text-discord-green">
                        Approved
                    </span>
                )}
            </div>
        </button>
    );
}
