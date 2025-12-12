/**
 * Paystack Payment Service
 * Handles payment processing for premium slips
 */

export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // In kobo (multiply GHS by 100)
  reference: string;
  currency?: 'GHS' | 'NGN' | 'USD';
  metadata?: any;
}

export interface PaymentResult {
  status: 'success' | 'cancelled' | 'failed';
  reference?: string;
  transactionId?: string;
  message?: string;
}

class PaystackService {
  // Paystack Test Public Key
  private readonly TEST_PUBLIC_KEY = 'pk_test_22eeaf379d48c3fac65b37d0506904d217249234';
  
  /**
   * Get Paystack public key (safe to use in frontend)
   */
  getPublicKey(): string {
    // In production, use environment variable
    // return process.env.PAYSTACK_PUBLIC_KEY || this.TEST_PUBLIC_KEY;
    return this.TEST_PUBLIC_KEY;
  }

  /**
   * Generate unique payment reference
   */
  generateReference(userId: string, slipId: string): string {
    const timestamp = Date.now();
    return `slip_${slipId}_${userId}_${timestamp}`;
  }

  /**
   * Convert GHS to kobo (Paystack uses smallest currency unit)
   */
  toKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert kobo to GHS
   */
  toGHS(kobo: number): number {
    return kobo / 100;
  }

  /**
   * Prepare payment config for slip purchase
   */
  prepareSlipPayment(
    userEmail: string,
    userId: string,
    slipId: string,
    amount: number,
    slipTitle: string
  ): PaystackConfig {
    return {
      publicKey: this.getPublicKey(),
      email: userEmail,
      amount: this.toKobo(amount),
      reference: this.generateReference(userId, slipId),
      currency: 'GHS',
      metadata: {
        userId,
        slipId,
        slipTitle,
        type: 'slip_purchase',
      },
    };
  }

  /**
   * Verify payment status (server-side recommended)
   */
  async verifyPayment(reference: string): Promise<boolean> {
    // In production, call your backend API to verify with Paystack
    // For now, we'll trust the client-side response
    console.log('Payment verification:', reference);
    return true;
  }
}

export const Paystack = new PaystackService();

