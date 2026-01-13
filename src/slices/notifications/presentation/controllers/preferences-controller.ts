import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { UpdateNotificationPreferencesUseCase } from '../../application/use-cases/update-notification-preferences-use-case';
import type { INotificationPreferencesRepository } from '../../../../shared/domain/notifications/repositories';
import { NotificationPreferences } from '../../../../shared/domain/notifications/value-objects/notification-preferences';
import { DomainError } from '../../../../shared/domain/exceptions/domain-error';
import { NotFoundError } from '../../../../shared/domain/exceptions/not-found-error';
import { TYPES } from '@/shared/infrastructure/di/types';

@injectable()
export class PreferencesController {
  constructor(
    @inject(TYPES.UpdateNotificationPreferencesUseCase) private readonly updatePreferencesUseCase: UpdateNotificationPreferencesUseCase,
    @inject(TYPES.NotificationPreferencesRepository) private readonly preferencesRepository: INotificationPreferencesRepository
  ) {}

  /**
   * Get user notification preferences
   * GET /api/notifications/preferences/:userId
   */
  async getPreferences(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const preferences = await this.preferencesRepository.findByUserId(params.userId);
      
      if (!preferences) {
        // Return default preferences if none exist
        const defaultPreferences = NotificationPreferences.createDefault(params.userId);
        return NextResponse.json(this.toDto(defaultPreferences));
      }

      return NextResponse.json(this.toDto(preferences));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update user notification preferences
   * PUT /api/notifications/preferences/:userId
   */
  async updatePreferences(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      const command = {
        userId: params.userId,
        globalEnabled: body.globalEnabled,
        categoryPreferences: body.categoryPreferences,
        defaultChannels: body.defaultChannels,
        quietHours: body.quietHours,
        emailDigest: body.emailDigest,
        language: body.language,
        timezone: body.timezone
      };

      const result = await this.updatePreferencesUseCase.execute(command);

      return NextResponse.json(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update specific category preferences
   * PATCH /api/notifications/preferences/:userId/categories/:category
   */
  async updateCategoryPreference(
    request: NextRequest, 
    { params }: { params: { userId: string; category: string } }
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Get existing preferences
      let preferences = await this.preferencesRepository.findByUserId(params.userId);
      if (!preferences) {
        preferences = NotificationPreferences.createDefault(params.userId);
      }

      // Update the specific category
      const updatedPreferences = preferences.updateCategoryPreference(
        params.category as any,
        body.enabled,
        body.channels
      );

      await this.preferencesRepository.save(updatedPreferences);

      return NextResponse.json(this.toDto(updatedPreferences));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update quiet hours
   * PATCH /api/notifications/preferences/:userId/quiet-hours
   */
  async updateQuietHours(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Get existing preferences
      let preferences = await this.preferencesRepository.findByUserId(params.userId);
      if (!preferences) {
        preferences = NotificationPreferences.createDefault(params.userId);
      }

      // Update quiet hours
      const updatedPreferences = body.quietHours 
        ? preferences.updateQuietHours(body.quietHours)
        : preferences.removeQuietHours();

      await this.preferencesRepository.save(updatedPreferences);

      return NextResponse.json(this.toDto(updatedPreferences));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update email digest settings
   * PATCH /api/notifications/preferences/:userId/email-digest
   */
  async updateEmailDigest(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Get existing preferences
      let preferences = await this.preferencesRepository.findByUserId(params.userId);
      if (!preferences) {
        preferences = NotificationPreferences.createDefault(params.userId);
      }

      // Update email digest
      const updatedPreferences = preferences.updateEmailDigest(body.emailDigest);

      await this.preferencesRepository.save(updatedPreferences);

      return NextResponse.json(this.toDto(updatedPreferences));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Enable/disable global notifications
   * PATCH /api/notifications/preferences/:userId/global
   */
  async updateGlobalSetting(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Get existing preferences
      let preferences = await this.preferencesRepository.findByUserId(params.userId);
      if (!preferences) {
        preferences = NotificationPreferences.createDefault(params.userId);
      }

      // Update global setting
      const updatedPreferences = body.enabled 
        ? preferences.enableGlobalNotifications()
        : preferences.disableGlobalNotifications();

      await this.preferencesRepository.save(updatedPreferences);

      return NextResponse.json(this.toDto(updatedPreferences));
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Reset preferences to default
   * POST /api/notifications/preferences/:userId/reset
   */
  async resetPreferences(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const defaultPreferences = NotificationPreferences.createDefault(params.userId);
      await this.preferencesRepository.save(defaultPreferences);

      return NextResponse.json({
        message: 'Preferences reset to default',
        preferences: this.toDto(defaultPreferences)
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete user preferences
   * DELETE /api/notifications/preferences/:userId
   */
  async deletePreferences(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const exists = await this.preferencesRepository.exists(params.userId);
      
      if (!exists) {
        return NextResponse.json(
          { error: 'Preferences not found' },
          { status: 404 }
        );
      }

      await this.preferencesRepository.deleteByUserId(params.userId);

      return NextResponse.json({
        message: 'Preferences deleted successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Export preferences
   * GET /api/notifications/preferences/:userId/export
   */
  async exportPreferences(request: NextRequest, { params }: { params: { userId: string } }): Promise<NextResponse> {
    try {
      const preferences = await this.preferencesRepository.findByUserId(params.userId);
      
      if (!preferences) {
        return NextResponse.json(
          { error: 'Preferences not found' },
          { status: 404 }
        );
      }

      const exportData = {
        userId: preferences.userId,
        globalEnabled: preferences.globalEnabled,
        categoryPreferences: preferences.categoryPreferences,
        defaultChannels: preferences.defaultChannels,
        quietHours: preferences.quietHours,
        emailDigest: preferences.emailDigest,
        language: preferences.language,
        timezone: preferences.timezone,
        exportedAt: new Date().toISOString()
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="notification-preferences-${params.userId}.json"`
        }
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  private toDto(preferences: NotificationPreferences) {
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

  private handleError(error: unknown): NextResponse {
    console.error('PreferencesController error:', error);

    if (error instanceof DomainError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}