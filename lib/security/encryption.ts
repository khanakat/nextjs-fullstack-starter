import CryptoJS from "crypto-js";

// Encryption service for field-level encryption
export class EncryptionService {
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 16;

  // Generate a new encryption key
  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(this.KEY_SIZE / 8).toString();
  }

  // Encrypt data with a given key
  static encrypt(data: string, key: string): { encrypted: string; iv: string } {
    const keyWordArray = CryptoJS.enc.Hex.parse(key);
    const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE);

    const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString(),
    };
  }

  // Decrypt data with a given key
  static decrypt(encryptedData: string, key: string, iv: string): string {
    const keyWordArray = CryptoJS.enc.Hex.parse(key);
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);

    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Hash sensitive data (one-way)
  static hash(data: string, salt?: string): string {
    const saltToUse = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    return CryptoJS.PBKDF2(data, saltToUse, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
  }

  // Generate a secure random token
  static generateToken(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  // Get key information (for KeyManagementService compatibility)
  static getKeyInfo(
    keyId: string,
  ): {
    keyId: string;
    algorithm: string;
    createdAt: Date;
    lastUsed?: Date;
    status: string;
    version: number;
  } | null {
    const key = KeyManagementService.getKey(keyId);
    if (!key) {
      return null;
    }

    return {
      keyId,
      algorithm: "AES-256-GCM",
      createdAt: new Date(), // In production, this would be stored
      lastUsed: undefined, // In production, this would be tracked
      status: "active",
      version: 1,
    };
  }

  // List all keys (for KeyManagementService compatibility)
  static listKeys(): Array<{
    keyId: string;
    algorithm: string;
    createdAt: Date;
    lastUsed?: Date;
    status: string;
    version: number;
  }> {
    // In production, this would return actual key metadata from secure storage
    return [];
  }

  // Encrypt PII data for database storage
  static encryptPII(data: string): { encryptedValue: string; keyId: string } {
    const key = this.generateKey();
    const keyId = this.generateToken(16);
    const { encrypted, iv } = this.encrypt(data, key);

    // In production, store the key securely (e.g., AWS KMS, Azure Key Vault)
    // For now, we'll store it with the keyId (not recommended for production)
    const encryptedValue = `${encrypted}:${iv}:${key}`;

    return {
      encryptedValue,
      keyId,
    };
  }

  // Decrypt PII data from database
  static decryptPII(encryptedValue: string, _keyId: string): string {
    const [encrypted, iv, key] = encryptedValue.split(":");
    return this.decrypt(encrypted, key, iv);
  }

  // Encrypt field data with optional key ID
  static encryptField(
    value: string,
    keyId?: string,
  ): { encryptedValue: string; keyId: string } {
    if (keyId) {
      // Use existing key if provided
      const key = KeyManagementService.getKey(keyId);
      if (!key) {
        throw new Error(`Key not found for keyId: ${keyId}`);
      }
      const { encrypted, iv } = this.encrypt(value, key);
      return {
        encryptedValue: `${encrypted}:${iv}`,
        keyId,
      };
    } else {
      // Generate new key and use PII encryption
      return this.encryptPII(value);
    }
  }

  // Decrypt field data with key ID
  static decryptField(encryptedValue: string, keyId: string): string {
    const key = KeyManagementService.getKey(keyId);
    if (!key) {
      // Try PII decryption format
      return this.decryptPII(encryptedValue, keyId);
    }

    const [encrypted, iv] = encryptedValue.split(":");
    return this.decrypt(encrypted, key, iv);
  }
}

// Key management service (simplified version)
export class KeyManagementService {
  private static keys: Map<string, string> = new Map();

  // Store encryption key
  static storeKey(keyId: string, key: string): void {
    // In production, use a secure key management service
    this.keys.set(keyId, key);
  }

  // Retrieve encryption key
  static getKey(keyId: string): string | undefined {
    return this.keys.get(keyId);
  }

  // Rotate encryption key
  static rotateKey(keyId: string): string {
    const newKey = EncryptionService.generateKey();
    this.keys.set(keyId, newKey);
    return newKey;
  }

  // Delete encryption key
  static deleteKey(keyId: string): void {
    this.keys.delete(keyId);
  }
}
