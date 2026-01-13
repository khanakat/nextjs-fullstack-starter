import { Setting } from '../entities/setting';

/**
 * Setting Repository Interface
 * Defines the contract for setting persistence
 */
export type ISettingRepository = {
  /**
   * Find a setting by key
   */
  findByKey(key: string): Promise<Setting | null>;
  
  /**
   * Find all settings
   */
  findAll(): Promise<Setting[]>;
  
  /**
   * Save a setting
   */
  save(setting: Setting): Promise<Setting>;
  
  /**
   * Update a setting
   */
  update(setting: Setting): Promise<Setting>;
  
  /**
   * Delete a setting
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Count settings
   */
  count(): Promise<number>;
}
