import { PrismaClient } from '@prisma/client';
import { Setting } from '../../domain/entities/setting';
import type { ISettingRepository } from '../../domain/repositories/setting-repository';
import { prisma } from '@/lib/prisma';

/**
 * Prisma Setting Repository
 * Implements setting persistence using Prisma ORM
 */
export class PrismaSettingRepository implements ISettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByKey(key: string): Promise<Setting | null> {
    const setting = await this.prisma.settings.findUnique({
      where: { key },
    });

    if (!setting) {
      return null;
    }

    return Setting.create({
      key: setting.key,
      value: setting.value,
      description: setting.description || undefined,
    });
  }

  async findAll(): Promise<Setting[]> {
    const settings = await this.prisma.settings.findMany({
      orderBy: { key: 'asc' },
    });

    return settings.map(setting =>
      Setting.create({
        key: setting.key,
        value: setting.value,
        description: setting.description || undefined,
      }),
    );
  }

  async save(setting: Setting): Promise<Setting> {
    const saved = await this.prisma.settings.create({
      data: {
        key: setting.getKey(),
        value: setting.getSettingValue(),
        description: setting.getDescription(),
      },
    });

    return Setting.create({
      key: saved.key,
      value: saved.value,
      description: saved.description || undefined,
    });
  }

  async update(setting: Setting): Promise<Setting> {
    const updated = await this.prisma.settings.update({
      where: { key: setting.getKey() },
      data: {
        value: setting.getSettingValue(),
        description: setting.getDescription(),
      },
    });

    return Setting.create({
      key: updated.key,
      value: updated.value,
      description: updated.description || undefined,
    });
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.prisma.settings.deleteMany({
      where: { key },
    });

    return result.count > 0;
  }

  async count(): Promise<number> {
    return this.prisma.settings.count();
  }
}

// Export singleton instance
export const prismaSettingRepository = new PrismaSettingRepository(prisma);
