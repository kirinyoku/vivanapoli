import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = [
    'jan.', 'feb.', 'mar.', 'apr.', 'mai', 'jun.',
    'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'des.'
  ];
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}. ${month} ${hours}:${minutes}`;
}
