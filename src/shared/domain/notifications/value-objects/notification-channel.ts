import { ValueObject } from '../../base/value-object';
import { DomainError } from '../../exceptions/domain-error';
import { ValidationError } from '../../exceptions/validation-error';

export enum ChannelType {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  WEBHOOK = 'webhook'
}

export interface NotificationChannelProps {
  type: ChannelType;
  enabled: boolean;
  config?: Record<string, any>;
}

export class NotificationChannel extends ValueObject<NotificationChannelProps> {
  private constructor(props: NotificationChannelProps) {
    super(props);
  }

  protected validate(props: NotificationChannelProps): void {
    if (!props.type) {
      throw new ValidationError('type', 'Channel type is required');
    }
    if (!Object.values(ChannelType).includes(props.type)) {
      throw new ValidationError('type', `Invalid channel type: ${props.type}`);
    }
  }

  public static create(
    typeOrProps: ChannelType | { type: ChannelType; enabled?: boolean; config?: Record<string, any> },
    enabled: boolean = true,
    config?: Record<string, any>
  ): NotificationChannel {
    if (typeof typeOrProps === 'object') {
      const { type, enabled: objEnabled = true, config: objConfig } = typeOrProps;
      this.validateChannelType(type);
      this.validateConfig(type, objConfig);
      return new NotificationChannel({
        type,
        enabled: objEnabled,
        config: objConfig
      });
    }

    const type = typeOrProps as ChannelType;
    this.validateChannelType(type);
    this.validateConfig(type, config);

    return new NotificationChannel({
      type,
      enabled,
      config
    });
  }

  public static inApp(): NotificationChannel {
    return new NotificationChannel({
      type: ChannelType.IN_APP,
      enabled: true
    });
  }

  public static email(config?: { template?: string; priority?: string }): NotificationChannel {
    return new NotificationChannel({
      type: ChannelType.EMAIL,
      enabled: true,
      config
    });
  }

  public static push(config?: { sound?: string; badge?: number }): NotificationChannel {
    return new NotificationChannel({
      type: ChannelType.PUSH,
      enabled: true,
      config
    });
  }

  public static sms(config?: { provider?: string }): NotificationChannel {
    return new NotificationChannel({
      type: ChannelType.SMS,
      enabled: true,
      config
    });
  }

  public static webhook(config: { url: string; method?: string; headers?: Record<string, string> }): NotificationChannel {
    if (!config.url) {
      throw new ValidationError('config.url', 'Webhook URL is required');
    }

    return new NotificationChannel({
      type: ChannelType.WEBHOOK,
      enabled: true,
      config: {
        method: 'POST',
        ...config
      }
    });
  }

  private static validateChannelType(type: ChannelType): void {
    if (!Object.values(ChannelType).includes(type)) {
      throw new ValidationError('type', `Invalid channel type: ${type}`);
    }
  }

  private static validateConfig(type: ChannelType, config?: Record<string, any>): void {
    // For WEBHOOK:
    // - allow creation without config (routing/tests may construct type-only channels)
    // - if config is provided, require a URL
    if (type === ChannelType.WEBHOOK && config !== undefined) {
      if (!config.url) {
        throw new ValidationError('config.url', 'Webhook URL is required');
      }
    }
  }

  public enable(): NotificationChannel {
    return new NotificationChannel({
      ...this._value,
      enabled: true
    });
  }

  public disable(): NotificationChannel {
    return new NotificationChannel({
      ...this._value,
      enabled: false
    });
  }

  public updateConfig(config: Record<string, any>): NotificationChannel {
    NotificationChannel.validateConfig(this._value.type, config);
    
    return new NotificationChannel({
      ...this._value,
      config: { ...this._value.config, ...config }
    });
  }

  public isEnabled(): boolean {
    return this._value.enabled;
  }

  public requiresExternalService(): boolean {
    return [ChannelType.EMAIL, ChannelType.PUSH, ChannelType.SMS, ChannelType.WEBHOOK].includes(this._value.type);
  }

  public get type(): ChannelType {
    return this._value.type;
  }

  public get enabled(): boolean {
    return this._value.enabled;
  }

  public get config(): Record<string, any> | undefined {
    return this._value.config ? { ...this._value.config } : undefined;
  }
}