import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
