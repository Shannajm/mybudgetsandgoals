import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'JMD' ? 'J$' : '$';
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
}

export function formatCurrencyWithSign(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'JMD' ? 'J$' : '$';
  
  if (amount > 0) {
    // Positive amount - show with symbol
    return `${symbol}${amount.toFixed(2)}`;
  } else if (amount < 0) {
    // Negative amount - show with minus sign
    return `-${symbol}${Math.abs(amount).toFixed(2)}`;
  } else {
    // Zero balance - neutral
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export function formatSigned(amount: number, type: 'income' | 'expense') {
  const signed = type === 'income' ? amount : -amount;
  return {
    text: signed < 0 ? `-${formatCurrency(Math.abs(signed))}` : `+${formatCurrency(signed)}`,
    color: signed < 0 ? 'red' : 'green'
  };
}