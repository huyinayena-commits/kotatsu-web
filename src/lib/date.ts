import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id'; // Indonesian locale

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.locale('id'); // Set default locale to Indonesian

/**
 * Format a date to relative time in Indonesian
 * e.g., "5 menit yang lalu", "2 jam yang lalu", "Baru saja"
 */
export function formatRelativeTime(date: string | Date | number): string {
    const now = dayjs();
    const target = dayjs(date);

    // If less than 1 minute ago, show "Baru saja"
    if (now.diff(target, 'second') < 60) {
        return 'Baru saja';
    }

    return target.fromNow();
}

/**
 * Format a date to a readable format
 * e.g., "15 Jan 2026"
 */
export function formatDate(date: string | Date | number): string {
    return dayjs(date).format('DD MMM YYYY');
}

/**
 * Format a date with time
 * e.g., "15 Jan 2026, 14:30"
 */
export function formatDateTime(date: string | Date | number): string {
    return dayjs(date).format('DD MMM YYYY, HH:mm');
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date | number): boolean {
    return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * Check if a date is within the last N hours
 */
export function isWithinHours(date: string | Date | number, hours: number): boolean {
    return dayjs().diff(dayjs(date), 'hour') < hours;
}

// Re-export dayjs for direct usage if needed
export { dayjs };
