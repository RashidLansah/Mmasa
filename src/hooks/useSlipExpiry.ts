/**
 * useSlipExpiry Hook
 * 
 * Provides real-time expiry status updates for a slip.
 * Updates every 30 seconds to ensure UI reflects current state.
 */

import { useState, useEffect, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { getExpiryStatus, isPurchasable, getMsRemaining, formatTimeRemaining } from '../utils/slipExpiry';

export interface SlipExpiryState {
  expiryStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  isPurchasable: boolean;
  msRemaining: number | null;
  timeRemaining: string;
}

/**
 * Hook to track slip expiry status with real-time updates
 * 
 * @param expiresAt - The expiration timestamp (Timestamp, Date, number, or null)
 * @param updateInterval - How often to check expiry (default: 30000ms = 30 seconds)
 * @returns SlipExpiryState with current expiry information
 */
export function useSlipExpiry(
  expiresAt: Timestamp | Date | number | null | undefined,
  updateInterval: number = 30000
): SlipExpiryState {
  const [now, setNow] = useState(Date.now());
  
  // Update current time at specified interval
  useEffect(() => {
    if (!expiresAt) {
      // No expiry set, no need to update
      return;
    }
    
    const interval = setInterval(() => {
      setNow(Date.now());
    }, updateInterval);
    
    // Also update immediately on mount
    setNow(Date.now());
    
    return () => clearInterval(interval);
  }, [expiresAt, updateInterval]);
  
  // Compute expiry state based on current time
  const state = useMemo((): SlipExpiryState => {
    const expiryStatus = getExpiryStatus(expiresAt);
    const purchasable = isPurchasable(expiresAt);
    const msRemaining = getMsRemaining(expiresAt);
    const timeRemaining = formatTimeRemaining(expiresAt);
    
    return {
      expiryStatus,
      isPurchasable: purchasable,
      msRemaining,
      timeRemaining,
    };
  }, [expiresAt, now]); // Recompute when expiresAt or now changes
  
  return state;
}

