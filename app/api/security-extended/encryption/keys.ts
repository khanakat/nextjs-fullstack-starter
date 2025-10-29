import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { RBACService } from "@/lib/security/rbac";
import {
  EncryptionService,
  KeyManagementService,
} from "@/lib/security/encryption";
import { SecurityAuditService } from "@/lib/security/audit";

// All services are static classes, no need to instantiate

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has permission to manage encryption keys
    const hasPermission = await RBACService.hasPermission(
      userId,
      "encryption",
      "admin",
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      // Get encryption key information (without exposing actual keys)
      const { keyId } = req.query;

      if (keyId) {
        // Get specific key info
        const keyInfo = EncryptionService.getKeyInfo(keyId as string);
        if (!keyInfo) {
          return res.status(404).json({ message: "Key not found" });
        }

        res.status(200).json({
          keyId: keyInfo.keyId,
          algorithm: keyInfo.algorithm,
          createdAt: keyInfo.createdAt,
          lastUsed: keyInfo.lastUsed,
          status: keyInfo.status,
          version: keyInfo.version,
        });
      } else {
        // Get all keys info
        const keys = EncryptionService.listKeys();
        const keysInfo = keys.map((key) => ({
          keyId: key.keyId,
          algorithm: key.algorithm,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed,
          status: key.status,
          version: key.version,
        }));

        res.status(200).json({ keys: keysInfo });
      }
    } else if (req.method === "POST") {
      // Generate new encryption key
      const { algorithm = "aes-256-gcm", purpose } = req.body;

      if (!["aes-256-gcm", "aes-256-cbc"].includes(algorithm)) {
        return res.status(400).json({ message: "Unsupported algorithm" });
      }

      const keyId = EncryptionService.generateToken(16);
      const key = EncryptionService.generateKey();
      KeyManagementService.storeKey(keyId, key);

      // Log key generation
      await SecurityAuditService.logSecurityEvent(
        "encryption_key_generated",
        "high",
        "Encryption Key Generated",
        `New encryption key generated with algorithm ${algorithm}`,
        userId,
        undefined,
        { algorithm, purpose, keyId },
      );

      res.status(201).json({
        message: "Encryption key generated successfully",
        keyId,
        algorithm,
      });
    } else if (req.method === "PUT") {
      // Rotate encryption key
      const { keyId } = req.body;

      if (!keyId) {
        return res.status(400).json({ message: "Key ID is required" });
      }

      KeyManagementService.rotateKey(keyId);

      // Log key rotation
      await SecurityAuditService.logSecurityEvent(
        "encryption_key_rotated",
        "high",
        "Encryption Key Rotated",
        `Encryption key ${keyId} rotated`,
        userId,
        undefined,
        { keyId, newKey: "rotated" },
      );

      res.status(200).json({
        message: "Encryption key rotated successfully",
        oldKeyId: keyId,
        newKeyId: keyId, // Same keyId, but key value is rotated
      });
    } else if (req.method === "DELETE") {
      // Delete encryption key (with safety checks)
      const { keyId, force } = req.body;

      if (!keyId) {
        return res.status(400).json({ message: "Key ID is required" });
      }

      // Check if key is in use (this would require checking encrypted fields)
      // For now, require force flag for deletion
      if (!force) {
        return res.status(400).json({
          message:
            "Key deletion requires force flag. Ensure no data is encrypted with this key.",
          warning: "Deleting a key will make encrypted data unrecoverable",
        });
      }

      KeyManagementService.deleteKey(keyId);

      // Log key deletion
      await SecurityAuditService.logSecurityEvent(
        "encryption_key_deleted",
        "critical",
        "Encryption Key Deleted",
        `Encryption key ${keyId} deleted (forced)`,
        userId,
        undefined,
        { keyId, forced: true },
      );

      res.status(200).json({ message: "Encryption key deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Encryption keys API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
