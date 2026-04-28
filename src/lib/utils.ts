import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDriveDirectLink = (url: string) => {
  if (!url) return '';
  // Enhanced regex to capture IDs from various Drive link formats (file/d/, open?id=, uc?id=, sharing, etc)
  const regExp = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|sharing)|(?:docs\.google\.com\/file\/d\/))([a-zA-Z0-9_-]{25,})/;
  const match = url.match(regExp);
  
  if (match && match[1]) {
    // This endpoint is generally the most reliable for direct image display in cross-origin environments
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
  }
  
  // If no match found by regex, it might be a direct ID already
  if (url.length >= 25 && !url.includes('/') && !url.includes('.')) {
    return `https://drive.google.com/thumbnail?id=${url}&sz=w1000`;
  }
  
  return url;
};

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
