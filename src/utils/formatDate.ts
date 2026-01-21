export function formatDate(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '-';
    const d = new Date(dateInput);

    // Ensure valid date
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
}
