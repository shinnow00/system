"use client";

import { ClipboardCheck } from "lucide-react";
import HrAttendanceBoard from "./hr/HrAttendanceBoard";
import HrEmployeeList from "./hr/HrEmployeeList";

interface HrViewProps {
    filter?: string;
}

export default function HrView({ filter = 'attendance' }: HrViewProps) {
    return (
        <div className="flex-1 flex flex-col bg-discord-bg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                    <ClipboardCheck className="text-discord-blurple" size={28} />
                    <h1 className="text-2xl font-bold text-discord-text">Human Resources</h1>
                </div>
                <p className="text-discord-text-muted">Daily Attendance & Performance Tracking</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {filter === 'attendance' ? (
                    <HrAttendanceBoard />
                ) : (
                    <HrEmployeeList />
                )}
            </div>
        </div>
    );
}
