import { EmailTemplate } from "../types";

type TemplateData = Record<string, any>;

/**
 * Simple template renderer that replaces {{variable}} with values
 */
function renderTemplate(template: string, data: TemplateData): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Template manager for email templates
 */
export class TemplateManager {
  private templates: Map<string, string> = new Map();

  /**
   * Register a template
   */
  registerTemplate(name: string, template: string): void {
    this.templates.set(name, template);
  }

  /**
   * Render a template with data
   */
  render(templateName: string, data: TemplateData): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    try {
      return renderTemplate(template, data);
    } catch (error) {
      throw new Error(`Failed to render template "${templateName}": ${error}`);
    }
  }

  /**
   * Check if template exists
   */
  hasTemplate(templateName: string): boolean {
    return this.templates.has(templateName);
  }

  /**
   * Get all registered template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();