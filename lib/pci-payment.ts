import { PCIService, EncryptionService } from './encryption';
import { createClient } from './supabase/server';

// PCI DSS Compliant Payment Processing Service
export class PCIPaymentService {
  private static supabase = createClient();

  /**
   * Process card payment with PCI DSS compliance
   */
  static async processCardPayment(
    amount: number,
    cardData: {
      number: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      holderName: string;
    },
    saleId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Validate card data format (but don't store it)
      if (!PCIService.validateCardNumber(cardData.number.replace(/\s/g, ''))) {
        return { success: false, error: 'Invalid card number' };
      }

      // Generate secure token for the card
      const cardToken = PCIService.tokenize(cardData.number.replace(/\s/g, ''));

      // Encrypt sensitive card metadata (not the actual card data)
      const cardMetadata = {
        lastFour: cardData.number.slice(-4),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        holderName: cardData.holderName,
        token: cardToken
      };

      const encryptedMetadata = EncryptionService.encrypt(JSON.stringify(cardMetadata));

      // Log the payment attempt in audit logs before processing
      await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'card', 'initiated');

      // In a real implementation, this would call a PCI-compliant payment gateway
      // For now, we'll simulate the payment processing
      const paymentResult = await this.simulatePaymentGateway(amount, cardToken);

      if (paymentResult.success) {
        // Store only the token and transaction reference, never the actual card data
        await this.storePaymentRecord({
          saleId,
          paymentMethodId,
          amount,
          transactionId: paymentResult.transactionId!,
          cardToken,
          encryptedMetadata,
          status: 'completed'
        });

        // Log successful payment
        await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'card', 'completed', paymentResult.transactionId);

        return { success: true, transactionId: paymentResult.transactionId };
      } else {
        // Log failed payment
        await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'card', 'failed', undefined, paymentResult.error);

        return { success: false, error: paymentResult.error };
      }
    } catch (error) {
      console.error('PCI Payment processing error:', error);

      // Log error
      await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'card', 'error', undefined, error instanceof Error ? error.message : 'Unknown error');

      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Process cash payment (simpler, no PCI concerns)
   */
  static async processCashPayment(
    amount: number,
    saleId: string,
    paymentMethodId: string,
    receivedAmount?: number
  ): Promise<{ success: boolean; change?: number; error?: string }> {
    try {
      // Log cash payment attempt
      await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'cash', 'initiated');

      // For cash payments, just store the record
      await this.storePaymentRecord({
        saleId,
        paymentMethodId,
        amount,
        receivedAmount,
        status: 'completed'
      });

      // Calculate change if overpayment
      const change = receivedAmount && receivedAmount > amount ? receivedAmount - amount : 0;

      // Log successful cash payment
      await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'cash', 'completed');

      return { success: true, change };
    } catch (error) {
      console.error('Cash payment processing error:', error);
      await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'cash', 'error', undefined, error instanceof Error ? error.message : 'Unknown error');

      return { success: false, error: 'Cash payment processing failed' };
    }
  }

  /**
   * Process mobile money payment
   */
  static async processMobilePayment(
    amount: number,
    phoneNumber: string,
    saleId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Log mobile payment attempt
      await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'mobile', 'initiated');

      // Simulate mobile money payment processing
      const paymentResult = await this.simulateMobilePayment(amount, phoneNumber);

      if (paymentResult.success) {
        // Store payment record with transaction reference
        await this.storePaymentRecord({
          saleId,
          paymentMethodId,
          amount,
          transactionId: paymentResult.transactionId!,
          phoneNumber: PCIService.maskSensitiveData(phoneNumber, 3, 3), // Mask phone number
          status: 'completed'
        });

        await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'mobile', 'completed', paymentResult.transactionId);

        return { success: true, transactionId: paymentResult.transactionId };
      } else {
        await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'mobile', 'failed', undefined, paymentResult.error);

        return { success: false, error: paymentResult.error };
      }
    } catch (error) {
      console.error('Mobile payment processing error:', error);
      await this.logPaymentAttempt(saleId, paymentMethodId, amount, 'mobile', 'error', undefined, error instanceof Error ? error.message : 'Unknown error');

      return { success: false, error: 'Mobile payment processing failed' };
    }
  }

  /**
   * Store payment record in database (PCI compliant - no sensitive card data)
   */
  private static async storePaymentRecord(paymentData: {
    saleId: string;
    paymentMethodId: string;
    amount: number;
    transactionId?: string;
    cardToken?: string;
    encryptedMetadata?: { encrypted: string; iv: string };
    receivedAmount?: number;
    phoneNumber?: string;
    status: string;
  }) {
    const record = {
      sale_id: paymentData.saleId,
      payment_method_id: paymentData.paymentMethodId,
      amount: paymentData.amount,
      reference_number: paymentData.transactionId || `REF_${Date.now()}`,
      received_amount: paymentData.receivedAmount,
      card_token: paymentData.cardToken,
      encrypted_metadata: paymentData.encryptedMetadata ? JSON.stringify(paymentData.encryptedMetadata) : null,
      phone_number: paymentData.phoneNumber,
      status: paymentData.status
    };

    const { error } = await (await this.supabase).from('payments').insert(record);

    if (error) {
      console.error('Error storing payment record:', error);
      throw error;
    }
  }

  /**
   * Log payment attempts for audit compliance
   */
  private static async logPaymentAttempt(
    saleId: string,
    paymentMethodId: string,
    amount: number,
    paymentType: string,
    status: string,
    transactionId?: string,
    error?: string
  ) {
    try {
      const supabase = await this.supabase;
      const { data: { user } } = await supabase.auth.getUser();

      const logData = {
        user_id: user?.id,
        action: `payment_${status}`,
        table_name: 'payments',
        record_id: saleId,
        old_data: null,
        new_data: {
          paymentMethodId,
          amount,
          paymentType,
          transactionId,
          error: error ? 'Payment processing error occurred' : null
        },
        ip_address: 'captured-from-request',
        compliance_flag: true,
        risk_level: error ? 'high' : 'low'
      };

      await supabase.from('audit_logs').insert(logData);
    } catch (logError) {
      console.error('Error logging payment attempt:', logError);
      // Don't throw here as it shouldn't break payment processing
    }
  }

  /**
   * Simulate payment gateway processing (replace with real gateway integration)
   */
  private static async simulatePaymentGateway(amount: number, cardToken: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        success: false,
        error: 'Payment declined by card issuer'
      };
    }
  }

  /**
   * Simulate mobile money payment processing
   */
  private static async simulateMobilePayment(amount: number, phoneNumber: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate 90% success rate for mobile payments
    const success = Math.random() > 0.10;

    if (success) {
      return {
        success: true,
        transactionId: `mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } else {
      return {
        success: false,
        error: 'Mobile money payment failed - insufficient balance or network error'
      };
    }
  }

  /**
   * Get payment methods that are PCI compliant
   */
  static async getCompliantPaymentMethods() {
    const supabase = await this.supabase;

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Validate payment method for PCI compliance
   */
  static isPaymentMethodCompliant(paymentMethodName: string): boolean {
    const compliantMethods = ['cash', 'card', 'credit_card', 'debit_card', 'mobile_money', 'airtel_money', 'mtn_mobile_money'];

    return compliantMethods.some(method =>
      paymentMethodName.toLowerCase().includes(method.toLowerCase().replace('_', ' '))
    );
  }
}