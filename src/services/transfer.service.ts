/**
 * Transfer Service
 * 
 * Handles withdrawal transfers via Paystack Transfer API
 * through our backend server
 */

const SERVER_URL = 'http://192.168.1.152:3001';

export interface TransferRequest {
  recipientCode: string;
  amount: number; // In GHS
  reference: string;
  reason?: string;
}

export interface TransferResult {
  success: boolean;
  transferCode?: string;
  reference?: string;
  status?: string;
  error?: string;
  message?: string;
}

export class TransferService {
  /**
   * Initiate a transfer to a mobile money account
   * 
   * @param request - Transfer request details
   * @returns Transfer result with status
   */
  static async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    try {
      console.log('💸 Initiating transfer:', request);

      // Create abort controller for manual timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(`${SERVER_URL}/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientCode: request.recipientCode,
            amount: request.amount,
            reference: request.reference,
            reason: request.reason || 'Mmasa earnings withdrawal',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('❌ Transfer request failed:', response.status);
          return {
            success: false,
            error: 'Failed to connect to transfer service',
          };
        }

        const result = await response.json();
        console.log('✅ Transfer result:', result);

        return result;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      console.error('❌ Transfer error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Transfer request timed out',
        };
      }

      return {
        success: false,
        error: error.message || 'Transfer failed',
      };
    }
  }
}
