"use client";

import { useState } from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { TaskPart } from "@/types/database";
import { useRouter } from "next/navigation";

interface TaskCheckboxProps {
    part: TaskPart;
    userRole: string;
    onUpdate?: (updatedPart: TaskPart) => void;
}

export default function TaskCheckbox({ part, userRole, onUpdate }: TaskCheckboxProps) {
    const [updating, setUpdating] = useState(false);
    const router = useRouter();

    const handleCheck = async () => {
        if (updating) return;

        console.log("Clicking part:", part.id); // Debug Log
        setUpdating(true);

        const supabase = createClient();

        // 1. Prepare the update object
        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (userRole === 'Visual Manager' || userRole === 'Admin') {
            // Manager Power: Mark both as true
            updates.designer_checked = true;
            updates.manager_approved = true;
        } else {
            // Normal Designer: Toggle the value (if it was false, make true)
            updates.designer_checked = !part.designer_checked;
        }

        // 2. Send update to Supabase for the current part
        const { error } = await supabase
            .from('task_parts')
            .update(updates)
            .eq('id', part.id);

        if (error) {
            console.error("Supabase Error:", error.message);
            alert("Error updating: " + error.message);
            setUpdating(false);
            return;
        }

        // 3. Fetch all parts for this task to determine parent task status
        const { data: allParts, error: partsError } = await supabase
            .from('task_parts')
            .select('*')
            .eq('task_id', part.task_id);

        if (partsError) {
            console.error("Error fetching all parts:", partsError.message);
        } else if (allParts) {
            const allChecked = allParts.every(p => p.designer_checked);
            const parentStatus = allChecked ? 'Done' : 'Todo';

            // 4. Update the Parent Task status
            const { error: taskError } = await supabase
                .from('tasks')
                .update({ status: parentStatus, updated_at: new Date().toISOString() })
                .eq('id', part.task_id);

            if (taskError) {
                console.error("Error updating parent task status:", taskError.message);
            }
        }

        // 5. Success!
        console.log("Success!");
        onUpdate?.({ ...part, ...updates });
        router.refresh();
        setUpdating(false);
    };

    // Get checkbox styling based on state
    const getStyle = () => {
        if (part.manager_approved) {
            return "bg-discord-green border-discord-green";
        } else if (part.designer_checked) {
            return "bg-discord-blurple border-discord-blurple";
        }
        return "bg-transparent border-discord-text-muted hover:border-discord-text";
    };

    return (
        <button
            onClick={handleCheck}
            disabled={updating}
            className="w-full flex items-center gap-3 p-2 rounded hover:bg-discord-item/50 transition-colors text-left group"
        >
            {/* Custom Checkbox */}
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${getStyle()}`}>
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
