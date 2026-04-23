import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind CSS class names.
 *
 * Combines `clsx` (conditional class joining) with `tailwind-merge`
 * (intelligent conflict resolution) so that later classes override
 * earlier ones on the same utility property. This is the standard
 * pattern used by shadcn/ui and similar Tailwind component libraries.
 *
 * Example:
 *  cn('px-4 py-2', 'px-6') → 'py-2 px-6'  (px-6 overrides px-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date string into Norwegian display format.
 * Example: "2026-04-23T17:30:00Z" → "23. apr. 17:30"
 */
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    'jan.',
    'feb.',
    'mar.',
    'apr.',
    'mai',
    'jun.',
    'jul.',
    'aug.',
    'sep.',
    'okt.',
    'nov.',
    'des.',
  ];
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}. ${month} ${hours}:${minutes}`;
}
