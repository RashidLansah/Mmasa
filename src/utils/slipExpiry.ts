/**
 * Slip Expiry Utilities
 * 
 * Single source of truth for slip expiration logic.
 * Uses expiresAt timestamp to determine expiry status without requiring Firestore updates.
 */

import { Timestamp } from 'firebase/firestore';

export type ExpiryStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

/**
 * Convert expiresAt to milliseconds for comparison
 */
function getExpiresAtMs(expiresAt: Timestamp | Date | number | null | undefined): number | null {
  if (!expiresAt) return null;
  
  if (typeof expiresAt === 'number') {
    return expiresAt;
  }
  
  if (expiresAt instanceof Date) {
    return expiresAt.getTime();
  }
  
  if (expiresAt instanceof Timestamp) {
    return expiresAt.toMillis();
  }
  
  // Try to convert if it's an object with toMillis or toDate
  if (typeof expiresAt === 'object' && 'toMillis' in expiresAt) {
    return (expiresAt as any).toMillis();
  }
  
  if (typeof expiresAt === 'object' && 'toDate' in expiresAt) {
    return (expiresAt as any).toDate().getTime();
  }
  
  return null;
}

/**
 * Get expiry status based on expiresAt timestamp
 * 
 * Rules:
 * - EXPIRED: now >= expiresAt
 * - EXPIRING_SOON: expiresAt - now <= 60 minutes and > 0
 * - ACTIVE: otherwise
 */
export function getExpiryStatus(expiresAt: Timestamp | Date | number | null | undefined): ExpiryStatus {
  const expiresAtMs = getExpiresAtMs(expiresAt);
  if (expiresAtMs === null) {
    return 'ACTIVE'; // No expiry set, consider active
  }
  
  const nowMs = Date.now();
  const diffMs = expiresAtMs - nowMs;
  
  if (diffMs <= 0) {
    return 'EXPIRED';
  }
  
  // 60 minutes = 60 * 60 * 1000 ms
  const sixtyMinutesMs = 60 * 60 * 1000;
  if (diffMs <= sixtyMinutesMs) {
    return 'EXPIRING_SOON';
  }
  
  return 'ACTIVE';
}

/**
 * Check if a slip is purchasable based on expiresAt
 * 
 * @param expiresAt - The expiration timestamp
 * @returns true if slip can be purchased (now < expiresAt), false otherwise
 */
export function isPurchasable(expiresAt: Timestamp | Date | number | null | undefined): boolean {
  const expiresAtMs = getExpiresAtMs(expiresAt);
  if (expiresAtMs === null) {
    return true; // No expiry set, allow purchase
  }
  
  const nowMs = Date.now();
  return nowMs < expiresAtMs;
}

/**
 * Get milliseconds remaining until expiration
 * 
 * @param expiresAt - The expiration timestamp
 * @returns milliseconds remaining (negative if expired), or null if no expiry set
 */
export function getMsRemaining(expiresAt: Timestamp | Date | number | null | undefined): number | null {
  const expiresAtMs = getExpiresAtMs(expiresAt);
  if (expiresAtMs === null) {
    return null;
  }
  
  return expiresAtMs - Date.now();
}

/**
 * Format remaining time as human-readable string
 * 
 * @param expiresAt - The expiration timestamp
 * @returns Formatted string like "5m", "1h 30m", or "Expired"
 */
export function formatTimeRemaining(expiresAt: Timestamp | Date | number | null | undefined): string {
  const msRemaining = getMsRemaining(expiresAt);
  
  if (msRemaining === null) {
    return 'No expiry';
  }
  
  if (msRemaining <= 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(msRemaining / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  return `${minutes}m`;
}

