import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getServerOrigin() {
  if (import.meta.env.PROD) {
    return '';
  }

  if (import.meta.env.VITE_SERVER_ORIGIN) {
    return import.meta.env.VITE_SERVER_ORIGIN;
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }

  return 'http://localhost:3004';
}

export function getApiBaseUrl() {
  return `${getServerOrigin()}/api`;
}
