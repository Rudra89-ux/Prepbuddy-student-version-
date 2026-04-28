import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDriveDirectLink = (url: string) => {
  if (!url) return '';
  const regExp = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|(?:docs\.google\.com\/file\/d\/))([a-zA-Z0-9_-]+)/;
  const match = url.match(regExp);
  if (match && match[1]) {
    // Using the alternative format that often works better for direct images
    return `https://docs.google.com/uc?export=view&id=${match[1]}`;
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
