import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/base/use-case';
import { Result } from '../../../../shared/application/base/result';
import { NotificationPreferences, CategoryPreference } from '../../../../shared/domain/notifications/value-objects/notification-preferences';
import type { INotificationPreferencesRepository } from '../../../../shared/domain/notifications/repositories';
import { NotificationCategory } from '../../../../shared/domain/notifications/entities/notification';
import { ChannelType } from '../../../../shared/domain/notifications/value-objects/notification-channel';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { TYPES } from '@/shared/infrastructure/di/types';

export interface UpdateNotificationPreferencesCommand {
  userId: string;
  globalEnabled?: boolean;
  categoryPreferences?: CategoryPreference[];
  defaultChannels?: ChannelType[];
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  emailDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string;
  };
  language?: string;
  timezone?: string;
}

export interface NotificationPreferencesResultDto {
  userId: string;
  globalEnabled: boolean;
  categoryPreferences: CategoryPreference[];
  defaultChannels: ChannelType[];
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  emailDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string;
  };
  language: string;
  timezone: string;
}

@injectable()
export class UpdateNotificationPreferencesUseCase extends UseCase<UpdateNotificationPreferencesCommand, NotificationPreferencesResultDto> {
  constructor(
    @inject(TYPES.NotificationRepository) private readonly preferencesRepository: INotificationPreferencesRepository
  ) {
    super();
  }

  async execute(command: UpdateNotificationPreferencesCommand): Promise<Result<NotificationPreferencesResultDto>> {
    return this.executeWithErrorHandling(command, async (command) => {
      // Validate command
      this.validateCommand(command);

      // Get existing preferences or create default
      let preferences = await this.preferencesRepository.findByUserId(command.userId);
      
      if (!preferences) {
        preferences = NotificationPreferences.createDefault(command.userId);
      }

      // Update preferences based on command
      let updatedPreferences = preferences;

      if (command.globalEnabled !== undefined) {
        updatedPreferences = command.globalEnabled 
          ? updatedPreferences.enableGlobalNotifications()
          : updatedPreferences.disableGlobalNotifications();
      }

      if (command.categoryPreferences) {
        for (const categoryPref of command.categoryPreferences) {
          updatedPreferences = updatedPreferences.updateCategoryPreference(
            categoryPref.category,
            categoryPref.enabled,
            categoryPref.channels
          );
        }
      }

      if (command.quietHours) {
        updatedPreferences = updatedPreferences.updateQuietHours(command.quietHours);
      } else if (command.quietHours === null) {
        updatedPreferences = updatedPreferences.removeQuietHours();
      }

      if (command.emailDigest) {
        updatedPreferences = updatedPreferences.updateEmailDigest(command.emailDigest);
      }

      // Create new preferences with updated values
      if (command.defaultChannels || command.language || command.timezone) {
        updatedPreferences = NotificationPreferences.create(
          updatedPreferences.userId,
          updatedPreferences.globalEnabled,
          updatedPreferences.categoryPreferences,
          command.defaultChannels || updatedPreferences.defaultChannels,
          updatedPreferences.quietHours,
          updatedPreferences.emailDigest,
          command.language || updatedPreferences.language,
          command.timezone || updatedPreferences.timezone
        );
      }

      // Save preferences
      await this.preferencesRepository.save(updatedPreferences);

      return this.toDto(updatedPreferences);
    });
  }

  private validateCommand(command: UpdateNotificationPreferencesCommand): void {
    if (!command.userId) {
      throw new ValidationError('User ID is required', 'userId');
    }

    // Validate category preferences
    if (command.categoryPreferences) {
      const categories = command.categoryPreferences.map(p => p.category);
      const uniqueCategories = new Set(categories);
      
      if (categories.length !== uniqueCategories.size) {
        throw new ValidationError('Duplicate category preferences are not allowed', 'categoryPreferences');
      }

      // Validate each category preference
      command.categoryPreferences.forEach(pref => {
        if (!Object.values(NotificationCategory).includes(pref.category)) {
          throw new ValidationError(`Invalid category: ${pref.category}`, 'categoryPreferences');
        }
        
        if (pref.channels.length === 0) {
          throw new ValidationError(`Category ${pref.category} must have at least one channel`, 'categoryPreferences');
        }

        pref.channels.forEach(channel => {
          if (!Object.values(ChannelType).includes(channel)) {
            throw new ValidationError(`Invalid channel type: ${channel}`, 'categoryPreferences');
          }
        });
      });
    }

    // Validate default channels
    if (command.defaultChannels) {
      if (command.defaultChannels.length === 0) {
        throw new ValidationError('At least one default channel must be specified', 'defaultChannels');
      }

      command.defaultChannels.forEach(channel => {
        if (!Object.values(ChannelType).includes(channel)) {
          throw new ValidationError(`Invalid channel type: ${channel}`, 'defaultChannels');
        }
      });
    }

    // Validate quiet hours
    if (command.quietHours) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegex.test(command.quietHours.start)) {
        throw new ValidationError('Quiet hours start time must be in HH:mm format', 'quietHours');
      }
      
      if (!timeRegex.test(command.quietHours.end)) {
        throw new ValidationError('Quiet hours end time must be in HH:mm format', 'quietHours');
      }

      if (!command.quietHours.timezone || command.quietHours.timezone.trim().length === 0) {
        throw new ValidationError('Quiet hours timezone cannot be empty', 'quietHours');
      }
    }

    // Validate email digest
    if (command.emailDigest) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegex.test(command.emailDigest.time)) {
        throw new ValidationError('Email digest time must be in HH:mm format', 'emailDigest');
      }

      const validFrequencies = ['daily', 'weekly', 'never'];
      if (!validFrequencies.includes(command.emailDigest.frequency)) {
        throw new ValidationError('Email digest frequency must be daily, weekly, or never', 'emailDigest');
      }
    }
  }

  private toDto(preferences: NotificationPreferences): NotificationPreferencesResultDto {
    return {
      userId: preferences.userId,
      globalEnabled: preferences.globalEnabled,
      categoryPreferences: preferences.categoryPreferences,
      defaultChannels: preferences.defaultChannels,
      quietHours: preferences.quietHours,
      emailDigest: preferences.emailDigest,
      language: preferences.language,
      timezone: preferences.timezone
    };
  }
}