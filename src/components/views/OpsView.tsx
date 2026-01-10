"use client";

import QuotationBoard from "./QuotationBoard";
import OpsTrackingBoard from "./OpsTrackingBoard";

interface OpsViewProps {
    filter?: string;
}

export default function OpsView({ filter = 'tracking' }: OpsViewProps) {
    if (filter === 'quotations') {
        return <QuotationBoard />;
    }

    if (filter === 'tracking') {
        return <OpsTrackingBoard />;
    }

    return (
        <div className="flex-1 flex items-center justify-center bg-discord-bg text-discord-text-muted">
            <p>Unknown Operations Channel: {filter}</p>
        </div>
    );
}
