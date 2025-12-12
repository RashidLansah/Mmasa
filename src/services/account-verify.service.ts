/**
 * Mobile Money Account Verification Service
 * 
 * Verifies mobile money accounts using Paystack Transfer Recipient API
 * via our backend server
 */

const SERVER_URL = 'http://192.168.1.152:3001';

export interface AccountVerificationResult {
  success: boolean;
  verified: boolean;
  accountName?: string;
  recipientCode?: string;
  error?: string;
}

export class AccountVerifyService {
  /**
   * Verify a mobile money account exists and get the real account holder name
   * 
   * @param phoneNumber - 10-digit phone number (e.g., "0501234567")
   * @param provider - Mobile money provider ("MTN", "Vodafone", "AirtelTigo")
   * @returns Verification result with account holder name if successful
   */
  static async verifyAccount(
    phoneNumber: string,
    provider: 'MTN' | 'Vodafone' | 'AirtelTigo'
  ): Promise<AccountVerificationResult> {
    try {
      console.log('🔍 Verifying account:', { phoneNumber, provider });

      // Create abort controller for manual timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${SERVER_URL}/verify-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
            provider,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('❌ Verification request failed:', response.status);
          return {
            success: false,
            verified: false,
            error: 'Failed to connect to verification service',
          };
        }

        const result = await response.json();
        console.log('✅ Verification result:', result);

        return result;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      console.error('❌ Account verification error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          verified: false,
          error: 'Verification request timed out',
        };
      }

      return {
        success: false,
        verified: false,
        error: error.message || 'Account verification failed',
      };
    }
  }

  /**
   * Format phone number for verification
   * Removes spaces, dashes, and ensures 10 digits
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If starts with 233, remove it
    if (digits.startsWith('233')) {
      return digits.substring(3);
    }
    
    // If starts with +233, already handled
    // If starts with 0, keep as is
    return digits;
  }
}

