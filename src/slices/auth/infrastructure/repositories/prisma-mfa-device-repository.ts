import { injectable, inject } from 'inversify';
import { PrismaClient } from '@prisma/client';
import { IMfaDeviceRepository } from '../../domain/repositories/mfa-device-repository';
import { MfaDevice, MfaDeviceType } from '../../domain/entities/mfa-device';
import { MfaCode } from '../../domain/value-objects/mfa-code';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Prisma MFA Device Repository
 * Prisma implementation of IMfaDeviceRepository
 */
@injectable()
export class PrismaMfaDeviceRepository implements IMfaDeviceRepository {
  constructor(@inject(TYPES.PrismaClient) private readonly prisma: PrismaClient) {}

  /**
   * Find MFA device by ID
   */
  async findById(id: UniqueId): Promise<MfaDevice | null> {
    const device = await this.prisma.mFADevice.findUnique({
      where: { id: id.value },
    });

    if (!device) {
      return null;
    }

    return MfaDevice.reconstitute(id, {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    });
  }

  /**
   * Find MFA devices by user ID
   */
  async findByUserId(userId: UniqueId): Promise<MfaDevice[]> {
    const devices = await this.prisma.mFADevice.findMany({
      where: { userId: userId.value },
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((device: any) => MfaDevice.reconstitute(UniqueId.create(device.id), {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    }));
  }

  /**
   * Find enabled MFA devices for user
   */
  async findEnabledByUserId(userId: UniqueId): Promise<MfaDevice[]> {
    const devices = await this.prisma.mFADevice.findMany({
      where: { userId: userId.value, enabled: true },
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((device: any) => MfaDevice.reconstitute(UniqueId.create(device.id), {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    }));
  }

  /**
   * Find MFA devices by user ID and type
   */
  async findByUserIdAndType(userId: UniqueId, type: MfaDeviceType): Promise<MfaDevice | null> {
    const device = await this.prisma.mFADevice.findFirst({
      where: {
        userId: userId.value,
        type,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!device) {
      return null;
    }

    return MfaDevice.reconstitute(UniqueId.create(device.id), {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    });
  }

  /**
   * Find primary MFA device for user
   */
  async findPrimaryByUserId(userId: UniqueId): Promise<MfaDevice | null> {
    // Note: Prisma schema doesn't have isPrimary field, so we'll use the first enabled device
    const device = await this.prisma.mFADevice.findFirst({
      where: {
        userId: userId.value,
        enabled: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!device) {
      return null;
    }

    return MfaDevice.reconstitute(UniqueId.create(device.id), {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    });
  }

  /**
   * Find MFA devices by type
   */
  async findByType(type: MfaDeviceType, limit?: number, offset?: number): Promise<MfaDevice[]> {
    const devices = await this.prisma.mFADevice.findMany({
      where: { type },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((device: any) => MfaDevice.reconstitute(UniqueId.create(device.id), {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    }));
  }

  /**
   * Find MFA devices by status
   */
  async findByStatus(verified: boolean, limit?: number, offset?: number): Promise<MfaDevice[]> {
    const devices = await this.prisma.mFADevice.findMany({
      where: { verified },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((device: any) => MfaDevice.reconstitute(UniqueId.create(device.id), {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    }));
  }

  /**
   * Save new MFA device
   */
  async save(device: MfaDevice): Promise<MfaDevice> {
    const data = device.toPersistence();

    const created = await this.prisma.mFADevice.create({
      data: {
        userId: data.userId.value,
        type: data.type,
        name: data.name,
        secret: data.secret,
        phoneNumber: data.phoneNumber,
        backupCodes: JSON.stringify(data.backupCodes.map((c: MfaCode) => c.toString())),
        verified: data.verified,
        enabled: data.enabled,
        lastUsed: data.lastUsedAt,
      },
    });

    return MfaDevice.reconstitute(UniqueId.create(created.id), {
      userId: UniqueId.create(created.userId),
      type: created.type as MfaDeviceType,
      name: created.name ?? undefined,
      secret: created.secret ?? undefined,
      phoneNumber: created.phoneNumber ?? undefined,
      backupCodes: created.backupCodes ? JSON.parse(created.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: created.verified,
      enabled: created.enabled,
      lastUsedAt: created.lastUsed ?? undefined,
    });
  }

  /**
   * Update existing MFA device
   */
  async update(device: MfaDevice): Promise<MfaDevice> {
    const data = device.toPersistence();

    const updated = await this.prisma.mFADevice.update({
      where: { id: device.id.value },
      data: {
        type: data.type,
        name: data.name,
        secret: data.secret,
        phoneNumber: data.phoneNumber,
        backupCodes: JSON.stringify(data.backupCodes.map((c: MfaCode) => c.toString())),
        verified: data.verified,
        enabled: data.enabled,
        lastUsed: data.lastUsedAt,
      },
    });

    return MfaDevice.reconstitute(device.id, {
      userId: UniqueId.create(updated.userId),
      type: updated.type as MfaDeviceType,
      name: updated.name ?? undefined,
      secret: updated.secret ?? undefined,
      phoneNumber: updated.phoneNumber ?? undefined,
      backupCodes: updated.backupCodes ? JSON.parse(updated.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: updated.verified,
      enabled: updated.enabled,
      lastUsedAt: updated.lastUsed ?? undefined,
    });
  }

  /**
   * Delete MFA device
   */
  async delete(id: UniqueId): Promise<void> {
    await this.prisma.mFADevice.delete({
      where: { id: id.value },
    });
  }

  /**
   * Delete all MFA devices for a user
   */
  async deleteByUserId(userId: UniqueId): Promise<void> {
    await this.prisma.mFADevice.deleteMany({
      where: { userId: userId.value },
    });
  }

  /**
   * Disable all MFA devices for a user
   */
  async disableAllForUser(userId: UniqueId): Promise<number> {
    const result = await this.prisma.mFADevice.updateMany({
      where: { userId: userId.value },
      data: { enabled: false },
    });

    return result.count;
  }

  /**
   * Count MFA devices by user
   */
  async countByUserId(userId: UniqueId): Promise<number> {
    return await this.prisma.mFADevice.count({
      where: { userId: userId.value },
    });
  }

  /**
   * Count enabled MFA devices for user
   */
  async countEnabledByUserId(userId: UniqueId): Promise<number> {
    return await this.prisma.mFADevice.count({
      where: { userId: userId.value, enabled: true },
    });
  }

  /**
   * Get total MFA device count
   */
  async count(): Promise<number> {
    return await this.prisma.mFADevice.count();
  }

  /**
   * Find all MFA devices with pagination
   */
  async findAll(limit?: number, offset?: number): Promise<MfaDevice[]> {
    const devices = await this.prisma.mFADevice.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return devices.map((device: any) => MfaDevice.reconstitute(UniqueId.create(device.id), {
      userId: UniqueId.create(device.userId),
      type: device.type as MfaDeviceType,
      name: device.name ?? undefined,
      secret: device.secret ?? undefined,
      phoneNumber: device.phoneNumber ?? undefined,
      backupCodes: device.backupCodes ? JSON.parse(device.backupCodes).map((c: string) => new MfaCode(c)) : [],
      verified: device.verified,
      enabled: device.enabled,
      lastUsedAt: device.lastUsed ?? undefined,
    }));
  }
}
