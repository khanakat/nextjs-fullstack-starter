import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { RBACService } from "@/lib/security/rbac";
import { EncryptionService } from "@/lib/security/encryption";
import { db as prisma } from "@/lib/db";
import { SecurityAuditService } from "@/lib/security/audit";

// EncryptionService is a static class, no need to instantiate

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has permission to manage encryption
    const hasPermission = await RBACService.hasPermission(
      userId,
      "encryption",
      "write",
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "POST") {
      // Encrypt field data
      const { entityId, fieldName, value, keyId } = req.body;

      if (!entityId || !fieldName || !value) {
        return res
          .status(400)
          .json({ message: "Entity ID, field name, and value are required" });
      }

      // Encrypt the value
      const encryptedData = EncryptionService.encryptField(value, keyId);

      // Store encrypted field
      const encryptedField = await prisma.encryptedField.create({
        data: {
          entityType: "User", // Default entity type, could be made configurable
          entityId,
          fieldName,
          encryptedValue: encryptedData.encryptedValue,
          keyId: encryptedData.keyId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log field encryption
      await SecurityAuditService.logSecurityEvent(
        "field_encrypted",
        "medium",
        "Field Encrypted",
        `Field ${fieldName} encrypted for entity ${entityId}`,
        userId,
        undefined,
        { entityId, fieldName, keyId: encryptedData.keyId },
      );

      res.status(201).json({
        message: "Field encrypted successfully",
        fieldId: encryptedField.id,
      });
    } else if (req.method === "GET") {
      // Decrypt field data
      const { entityId, fieldName, fieldId } = req.query;

      let encryptedField;

      if (fieldId) {
        encryptedField = await prisma.encryptedField.findUnique({
          where: { id: fieldId as string },
        });
      } else if (entityId && fieldName) {
        encryptedField = await prisma.encryptedField.findFirst({
          where: {
            entityId: entityId as string,
            fieldName: fieldName as string,
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        return res
          .status(400)
          .json({
            message: "Field ID or entity ID and field name are required",
          });
      }

      if (!encryptedField) {
        return res.status(404).json({ message: "Encrypted field not found" });
      }

      // Decrypt the value
      const decryptedValue = EncryptionService.decryptField(
        encryptedField.encryptedValue,
        encryptedField.keyId,
      );

      // Log field decryption
      await SecurityAuditService.logSecurityEvent(
        "field_decrypted",
        "medium",
        "Field Decrypted",
        `Field ${encryptedField.fieldName} decrypted for entity ${encryptedField.entityId}`,
        userId,
        undefined,
        {
          entityId: encryptedField.entityId,
          fieldName: encryptedField.fieldName,
          keyId: encryptedField.keyId,
        },
      );

      res.status(200).json({
        fieldId: encryptedField.id,
        entityId: encryptedField.entityId,
        fieldName: encryptedField.fieldName,
        value: decryptedValue,
        keyId: encryptedField.keyId,
        createdAt: encryptedField.createdAt,
      });
    } else if (req.method === "PUT") {
      // Update encrypted field
      const { fieldId, value, keyId } = req.body;

      if (!fieldId || !value) {
        return res
          .status(400)
          .json({ message: "Field ID and value are required" });
      }

      const existingField = await prisma.encryptedField.findUnique({
        where: { id: fieldId },
      });

      if (!existingField) {
        return res.status(404).json({ message: "Encrypted field not found" });
      }

      // Encrypt the new value
      const encryptedData = EncryptionService.encryptField(
        value,
        keyId || existingField.keyId,
      );

      // Update the field
      const updatedField = await prisma.encryptedField.update({
        where: { id: fieldId },
        data: {
          encryptedValue: encryptedData.encryptedValue,
          keyId: encryptedData.keyId,
          updatedAt: new Date(),
        },
      });

      // Log field update
      await SecurityAuditService.logSecurityEvent(
        "field_updated",
        "medium",
        "Field Updated",
        `Field ${updatedField.fieldName} updated for entity ${updatedField.entityId}`,
        userId,
        undefined,
        {
          entityId: updatedField.entityId,
          fieldName: updatedField.fieldName,
          keyId: updatedField.keyId,
        },
      );

      res.status(200).json({
        message: "Encrypted field updated successfully",
        fieldId: updatedField.id,
      });
    } else if (req.method === "DELETE") {
      // Delete encrypted field
      const { fieldId } = req.body;

      if (!fieldId) {
        return res.status(400).json({ message: "Field ID is required" });
      }

      const encryptedField = await prisma.encryptedField.findUnique({
        where: { id: fieldId },
      });

      if (!encryptedField) {
        return res.status(404).json({ message: "Encrypted field not found" });
      }

      await prisma.encryptedField.delete({
        where: { id: fieldId },
      });

      // Log field deletion
      await SecurityAuditService.logSecurityEvent(
        "field_deleted",
        "high",
        "Field Deleted",
        `Field ${encryptedField.fieldName} deleted for entity ${encryptedField.entityId}`,
        userId,
        undefined,
        {
          entityId: encryptedField.entityId,
          fieldName: encryptedField.fieldName,
        },
      );

      res.status(200).json({ message: "Encrypted field deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Encrypted fields API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
