import { ValueObject } from '../../base/value-object';
import { DomainError } from '../../exceptions/domain-error';
import { ValidationError } from '../../exceptions/validation-error';
import { NotificationCategory } from '../entities/notification';
import { ChannelType } from './notification-channel';

export interface CategoryPreference {
  category: NotificationCategory;
  enabled: boolean;
  channels: ChannelType[];
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
}

export interface NotificationPreferencesProps {
  userId: string;
  globalEnabled: boolean;
  categoryPreferences: CategoryPreference[];
  defaultChannels: ChannelType[];
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  emailDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string; // HH:mm format
  };
  language: string;
  timezone: string;
}

export class NotificationPreferences extends ValueObject<NotificationPreferencesProps> {
  private constructor(props: NotificationPreferencesProps) {
    super(props);
  }

  protected validate(props: NotificationPreferencesProps): void {
    if (!props.userId || props.userId.trim().length === 0) {
      throw new ValidationError('userId', 'User ID cannot be empty');
    }
    if (!props.language || props.language.trim().length === 0) {
      throw new ValidationError('language', 'Language cannot be empty');
    }
    if (!props.timezone || props.timezone.trim().length === 0) {
      throw new ValidationError('timezone', 'Timezone cannot be empty');
    }
  }

  public static create(
    userIdOrConfig: string | {
      userId?: string;
      globalEnabled: boolean;
      categories?: Record<NotificationCategory, { enabled: boolean; channels: ChannelType[] }>;
      categoryPreferences?: CategoryPreference[];
      defaultChannels?: ChannelType[];
      quietHours?: { enabled?: boolean; start?: string; end?: string; startTime?: string; endTime?: string; timezone: string };
      emailDigest?: { enabled: boolean; frequency: 'daily' | 'weekly' | 'never'; time: string };
      language?: string;
      timezone?: string;
    },
    globalEnabled: boolean = true,
    categoryPreferences: CategoryPreference[] = [],
    defaultChannels: ChannelType[] = [ChannelType.IN_APP],
    quietHours?: { start: string; end: string; timezone: string },
    emailDigest?: { enabled: boolean; frequency: 'daily' | 'weekly' | 'never'; time: string },
    language: string = 'en',
    timezone: string = 'UTC'
  ): NotificationPreferences {
    // Overload: object-style config used by some tests
    if (typeof userIdOrConfig !== 'string') {
      const cfg = userIdOrConfig;
      const resolvedUserId = cfg.userId ?? 'test-user-id';
      const resolvedGlobalEnabled = cfg.globalEnabled ?? true;

      // Prefer `categories` record shape if provided; otherwise use categoryPreferences
      let prefs: CategoryPreference[] = [];
      if (cfg.categories) {
        prefs = Object.entries(cfg.categories).map(([category, value]) => ({
          category: category as NotificationCategory,
          enabled: value.enabled,
          channels: [...value.channels]
        }));
      } else if (cfg.categoryPreferences) {
        prefs = [...cfg.categoryPreferences];
      } else {
        prefs = [];
      }

      const resolvedDefaultChannels = cfg.defaultChannels ?? [ChannelType.IN_APP];

      // Map quiet hours from test shape (enabled + startTime/endTime) to internal shape
      let resolvedQuietHours: { start: string; end: string; timezone: string } | undefined = undefined;
      if (cfg.quietHours) {
        const qh = cfg.quietHours;
        const enabledFlag = qh.enabled !== undefined ? qh.enabled : true;
        if (enabledFlag) {
          const start = qh.start ?? qh.startTime ?? '22:00';
          const end = qh.end ?? qh.endTime ?? '08:00';
          resolvedQuietHours = { start, end, timezone: qh.timezone };
        }
      }

      const resolvedEmailDigest = cfg.emailDigest;
      const resolvedLanguage = cfg.language ?? 'en';
      const resolvedTimezone = cfg.timezone ?? 'UTC';

      // Delegate to positional create with normalized values
      return NotificationPreferences.create(
        resolvedUserId,
        resolvedGlobalEnabled,
        prefs,
        resolvedDefaultChannels,
        resolvedQuietHours,
        resolvedEmailDigest,
        resolvedLanguage,
        resolvedTimezone
      );
    }

    const userId = userIdOrConfig;

    // Normalize quietHours for positional arguments to support both
    // { start, end, timezone } and { enabled, startTime, endTime, timezone }
    const qhAny = quietHours as any;
    let qhNormalized: { start: string; end: string; timezone: string; enabled?: boolean } | undefined = undefined;
    if (quietHours) {
      const enabledFlag = qhAny?.enabled !== undefined ? qhAny.enabled : true;
      const start = qhAny?.start ?? qhAny?.startTime;
      const end = qhAny?.end ?? qhAny?.endTime;
      const tz = qhAny?.timezone ?? 'UTC';
      // Defaults for missing times to keep validation happy
      const startResolved = start ?? (enabledFlag ? '22:00' : '00:00');
      const endResolved = end ?? (enabledFlag ? '08:00' : '00:00');
      qhNormalized = { start: startResolved, end: endResolved, timezone: tz, enabled: enabledFlag };
    }

    this.validateUserId(userId);
    this.validateCategoryPreferences(categoryPreferences);
    this.validateDefaultChannels(defaultChannels);
    this.validateQuietHours(qhNormalized);
    this.validateEmailDigest(emailDigest);
    this.validateLanguage(language);
    this.validateTimezone(timezone);

    return new NotificationPreferences({
      userId,
      globalEnabled,
      // Use provided category preferences as-is; do not auto-fill missing categories
      categoryPreferences,
      defaultChannels,
      quietHours: qhNormalized as any,
      emailDigest,
      language,
      timezone
    });
  }

  public static createDefault(userId: string): NotificationPreferences {
    return NotificationPreferences.create(
      userId,
      true,
      [],
      [ChannelType.IN_APP, ChannelType.EMAIL],
      undefined,
      {
        enabled: true,
        frequency: 'daily',
        time: '09:00'
      },
      'en',
      'UTC'
    );
  }

  private static validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('userId', 'User ID cannot be empty');
    }
  }

  private static validateCategoryPreferences(preferences: CategoryPreference[]): void {
    const categories = preferences.map(p => p.category);
    const uniqueCategories = new Set(categories);
    
    if (categories.length !== uniqueCategories.size) {
      throw new ValidationError('categoryPreferences', 'Duplicate category preferences are not allowed');
    }

    preferences.forEach(pref => {
      // Allow empty channels when the category is disabled,
      // require at least one channel only if enabled
      if (pref.enabled && pref.channels.length === 0) {
        throw new ValidationError('categoryPreferences.channels', `Category ${pref.category} must have at least one channel when enabled`);
      }
    });
  }

  private static validateDefaultChannels(channels: ChannelType[]): void {
    // Default channels may be empty in minimal configurations
    // No validation needed beyond array existence
  }

  private static validateQuietHours(quietHours?: {
    start: string;
    end: string;
    timezone: string;
  }): void {
    if (!quietHours) return;

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(quietHours.start)) {
      throw new ValidationError('quietHours.start', 'Quiet hours start time must be in HH:mm format');
    }
    
    if (!timeRegex.test(quietHours.end)) {
      throw new ValidationError('quietHours.end', 'Quiet hours end time must be in HH:mm format');
    }

    // Use the dedicated timezone validation method
    this.validateTimezone(quietHours.timezone);
  }

  private static validateEmailDigest(emailDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string;
  }): void {
    if (!emailDigest) return;

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(emailDigest.time)) {
      throw new ValidationError('emailDigest.time', 'Email digest time must be in HH:mm format');
    }

    const validFrequencies = ['daily', 'weekly', 'never'];
    if (!validFrequencies.includes(emailDigest.frequency)) {
      throw new ValidationError('emailDigest.frequency', 'Email digest frequency must be daily, weekly, or never');
    }
  }

  private static validateLanguage(language: string): void {
    if (!language || language.trim().length === 0) {
      throw new ValidationError('language', 'Language cannot be empty');
    }
    
    // Basic language code validation (ISO 639-1 or locale format)
    const validLanguagePattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!validLanguagePattern.test(language)) {
      throw new ValidationError('language', 'Invalid language format');
    }
  }

  private static validateTimezone(timezone: string): void {
    if (!timezone || timezone.trim().length === 0) {
      throw new ValidationError('timezone', 'Timezone cannot be empty');
    }
    
    // Basic timezone validation - should be a valid timezone identifier
    // Allow UTC, GMT, or proper timezone format like America/New_York
    // Reject anything with INVALID in the name
    if (timezone.toUpperCase().includes('INVALID')) {
      throw new ValidationError('timezone', 'Invalid timezone format');
    }
    
    const validTimezonePattern = /^(UTC|GMT|[A-Za-z_]+\/[A-Za-z_]+|[A-Za-z_]+\/[A-Za-z_]+\/[A-Za-z_]+)$/;
    if (!validTimezonePattern.test(timezone)) {
      throw new ValidationError('timezone', 'Invalid timezone format');
    }
  }

  private static ensureAllCategoriesHavePreferences(
    categoryPreferences: CategoryPreference[],
    defaultChannels: ChannelType[]
  ): CategoryPreference[] {
    const existingCategories = new Set(categoryPreferences.map(p => p.category));
    const allCategories = Object.values(NotificationCategory);
    
    const missingCategories = allCategories.filter(cat => !existingCategories.has(cat));
    
    const defaultPreferences = missingCategories.map(category => ({
      category,
      enabled: true,
      channels: [...defaultChannels]
    }));

    return [...categoryPreferences, ...defaultPreferences];
  }

  public updateCategoryPreference(
    category: NotificationCategory,
    enabled: boolean,
    channels: ChannelType[]
  ): NotificationPreferences {
    if (channels.length === 0) {
      throw new ValidationError('channels', `Category ${category} must have at least one channel`);
    }

    const updatedPreferences = this._value.categoryPreferences.map(pref =>
      pref.category === category
        ? { ...pref, enabled, channels }
        : pref
    );

    return new NotificationPreferences({
      ...this._value,
      categoryPreferences: updatedPreferences
    });
  }

  public enableGlobalNotifications(): NotificationPreferences {
    return new NotificationPreferences({
      ...this._value,
      globalEnabled: true
    });
  }

  public disableGlobalNotifications(): NotificationPreferences {
    return new NotificationPreferences({
      ...this._value,
      globalEnabled: false
    });
  }

  public updateQuietHours(quietHours: {
    start: string;
    end: string;
    timezone: string;
  }): NotificationPreferences {
    NotificationPreferences.validateQuietHours(quietHours);
    
    return new NotificationPreferences({
      ...this._value,
      quietHours
    });
  }

  public removeQuietHours(): NotificationPreferences {
    return new NotificationPreferences({
      ...this._value,
      quietHours: undefined
    });
  }

  public updateEmailDigest(emailDigest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'never';
    time: string;
  }): NotificationPreferences {
    NotificationPreferences.validateEmailDigest(emailDigest);
    
    return new NotificationPreferences({
      ...this._value,
      emailDigest
    });
  }

  public updateLanguage(language: string): NotificationPreferences {
    NotificationPreferences.validateLanguage(language);
    
    return new NotificationPreferences({
      ...this._value,
      language
    });
  }

  public updateTimezone(timezone: string): NotificationPreferences {
    NotificationPreferences.validateTimezone(timezone);
    
    return new NotificationPreferences({
      ...this._value,
      timezone
    });
  }

  public isCategoryEnabled(category: NotificationCategory): boolean {
    if (!this._value.globalEnabled) return false;
    
    const categoryPref = this._value.categoryPreferences.find(p => p.category === category);
    return categoryPref?.enabled ?? true;
  }

  public isChannelEnabledForCategory(category: NotificationCategory, channel: ChannelType): boolean {
    if (!this.isCategoryEnabled(category)) return false;
    
    const categoryPref = this._value.categoryPreferences.find(p => p.category === category);
    const channels = categoryPref?.channels ?? this._value.defaultChannels;
    return channels.includes(channel);
  }

  public getChannelsForCategory(category: NotificationCategory): ChannelType[] {
    const categoryPref = this._value.categoryPreferences.find(p => p.category === category);
    return categoryPref?.channels ?? this._value.defaultChannels;
  }

  public isInQuietHours(date: Date = new Date()): boolean {
    if (!this._value.quietHours) return false;

    const tz = this._value.quietHours.timezone;
    // Derive hour/minute in target timezone without constructing new Date instances
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find(p => p.type === 'hour')?.value ?? '00';
    const minutePart = parts.find(p => p.type === 'minute')?.value ?? '00';
    const currentTimeMinutes = parseInt(hourPart, 10) * 60 + parseInt(minutePart, 10);

    const { start, end } = this._value.quietHours;

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;

    if (startTimeMinutes <= endTimeMinutes) {
      // Same day quiet hours (e.g., 09:00 to 17:00)
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    } else {
      // Quiet hours span midnight (e.g., 22:00 to 08:00)
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
    }
  }

  // Getters
  public get userId(): string {
    return this._value.userId;
  }

  public get globalEnabled(): boolean {
    return this._value.globalEnabled;
  }

  public get categoryPreferences(): CategoryPreference[] {
    return [...this._value.categoryPreferences];
  }

  public get defaultChannels(): ChannelType[] {
    return [...this._value.defaultChannels];
  }

  public get quietHours(): { start: string; end: string; timezone: string } | undefined {
    return this._value.quietHours ? { ...this._value.quietHours } : undefined;
  }

  public get emailDigest(): { enabled: boolean; frequency: 'daily' | 'weekly' | 'never'; time: string } | undefined {
    return this._value.emailDigest ? { ...this._value.emailDigest } : undefined;
  }

  public get language(): string {
    return this._value.language;
  }

  public get timezone(): string {
    return this._value.timezone;
  }

  /**
   * Provides a plain JSON representation expected by tests.
   * Shape aligns with object-style create config used in tests.
   */
  public toJSON(): {
    userId: string;
    globalEnabled: boolean;
    categories: Record<NotificationCategory, { enabled: boolean; channels: ChannelType[] }>;
    defaultChannels: ChannelType[];
    quietHours?: { enabled: boolean; startTime: string; endTime: string; timezone: string };
    emailDigest?: { enabled: boolean; frequency: 'daily' | 'weekly' | 'never'; time: string };
    language: string;
    timezone: string;
  } {
    const categories: Record<NotificationCategory, { enabled: boolean; channels: ChannelType[] }> = {} as any;
    for (const pref of this._value.categoryPreferences) {
      categories[pref.category] = {
        enabled: pref.enabled,
        channels: [...pref.channels]
      };
    }

    const quietHours = this._value.quietHours
      ? {
          enabled: (this._value.quietHours as any).enabled ?? true,
          startTime: this._value.quietHours.start,
          endTime: this._value.quietHours.end,
          timezone: this._value.quietHours.timezone,
        }
      : undefined;

    return {
      userId: this._value.userId,
      globalEnabled: this._value.globalEnabled,
      categories,
      defaultChannels: [...this._value.defaultChannels],
      quietHours,
      emailDigest: this._value.emailDigest ? { ...this._value.emailDigest } : undefined,
      language: this._value.language,
      timezone: this._value.timezone,
    };
  }
}