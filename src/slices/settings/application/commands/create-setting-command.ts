/**
 * Create Setting Command
 * Command for creating a new setting
 */
export class CreateSettingCommand {
  public readonly key: string;
  public readonly value: string;
  public readonly description?: string;

  constructor(props: { key: string; value: string; description?: string }) {
    this.key = props.key;
    this.value = props.value;
    this.description = props.description;
  }
}

/**
 * Update Setting Command
 * Command for updating a setting
 */
export class UpdateSettingCommand {
  public readonly key: string;
  public readonly value: string;
  public readonly description?: string;

  constructor(props: { key: string; value: string; description?: string }) {
    this.key = props.key;
    this.value = props.value;
    this.description = props.description;
  }
}

/**
 * Delete Setting Command
 * Command for deleting a setting
 */
export class DeleteSettingCommand {
  public readonly key: string;

  constructor(props: { key: string }) {
    this.key = props.key;
  }
}

/**
 * Get Setting Query
 * Query for retrieving a setting
 */
export class GetSettingQuery {
  public readonly key: string;

  constructor(props: { key: string }) {
    this.key = props.key;
  }
}

/**
 * List Settings Query
 * Query for listing all settings
 */
export class ListSettingsQuery {
  public readonly limit?: number;
  public readonly offset?: number;

  constructor(props: { limit?: number; offset?: number }) {
    this.limit = props.limit || undefined;
    this.offset = props.offset || undefined;
  }
}

/**
 * Get Settings Query
 * Query for retrieving all settings
 */
export class GetSettingsQuery {
  constructor() {}
}
