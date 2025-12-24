import crypto from 'crypto';

// Encryption utilities for sensitive data compliance
export class EncryptionService {
  private static algorithm = 'aes-256-cbc';
  private static keyLength = 32; // 256 bits
  private static ivLength = 16; // 128 bits

  /**
   * Generate a random encryption key
   */
  static generateKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string, key?: Buffer): { encrypted: string; iv: string } {
    const encryptionKey = key || this.generateKey();
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encrypted: string, iv: string, key: Buffer): string {
    const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash sensitive data (one-way encryption for passwords, etc.)
   */
  static hash(data: string, saltRounds = 12): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(data, 'SMMS-POS-SALT', 64, { N: 1 << saltRounds }, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      });
    });
  }

  /**
   * Generate secure token for sessions
   */
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask sensitive data for display (e.g., credit card numbers)
   */
  static maskSensitiveData(data: string, visibleStart = 4, visibleEnd = 4, maskChar = '*'): string {
    if (data.length <= visibleStart + visibleEnd) return data;

    const start = data.substring(0, visibleStart);
    const end = data.substring(data.length - visibleEnd);
    const maskLength = data.length - visibleStart - visibleEnd;

    return start + maskChar.repeat(maskLength) + end;
  }

  /**
   * Validate encrypted data integrity
   */
  static validateEncryption(data: string, expectedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  }
}

// PCI DSS compliant payment data handling
export class PCIService {
  /**
   * Tokenize payment data (replace sensitive data with tokens)
   */
  static tokenize(cardNumber: string): string {
    // In production, this would call a PCI-compliant tokenization service
    // For now, return a hashed token
    const hash = crypto.createHash('sha256');
    hash.update(cardNumber + 'SMMS-PCI-SALT');
    return 'tok_' + hash.digest('hex').substring(0, 24);
  }

  /**
   * Validate card number using Luhn algorithm
   */
  static validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Mask card number for display
   */
  static maskCardNumber(cardNumber: string): string {
    const lastFour = cardNumber.slice(-4);
    return '**** **** **** ' + lastFour;
  }

  /**
   * Mask sensitive data for display (general purpose)
   */
  static maskSensitiveData(data: string, visibleStart = 4, visibleEnd = 4, maskChar = '*'): string {
    if (data.length <= visibleStart + visibleEnd) return data;

    const start = data.substring(0, visibleStart);
    const end = data.substring(data.length - visibleEnd);
    const maskLength = data.length - visibleStart - visibleEnd;

    return start + maskChar.repeat(maskLength) + end;
  }
}

// GDPR compliance utilities
export class GDPRService {
  /**
   * Anonymize personal data
   */
  static anonymize(data: string): string {
    // Replace with hashed value for analytics while maintaining uniqueness
    return crypto.createHash('sha256').update(data + 'GDPR-ANON').digest('hex');
  }

  /**
   * Check if data contains PII (Personal Identifiable Information)
   */
  static containsPII(text: string): boolean {
    // Simple regex patterns for common PII
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4} \d{4} \d{4} \d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{10,15}\b/ // Phone numbers
    ];

    return piiPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Generate consent record
   */
  static generateConsentRecord(userId: string, consentType: string, consentGiven: boolean): object {
    return {
      userId,
      consentType,
      consentGiven,
      timestamp: new Date().toISOString(),
      ipAddress: 'captured-from-request', // Would be captured from actual request
      userAgent: 'captured-from-request' // Would be captured from actual request
    };
  }
}