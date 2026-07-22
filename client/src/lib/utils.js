import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getServerOrigin() {
  if (process.env.NODE_ENV === 'production') {
    return '';
  }

  if (process.env.REACT_APP_SERVER_ORIGIN) {
    return process.env.REACT_APP_SERVER_ORIGIN;
  }

  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '');
  }

  return 'http://localhost:3004';
}

export function getApiBaseUrl() {
  return `${getServerOrigin()}/api`;
}
