/**
 * Email Template Entity
 * Represents an email template
 */

export enum EmailTemplateCategory {
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  MARKETING = 'marketing',
  TRANSACTIONAL = 'transactional',
  NEWSLETTER = 'newsletter',
}

export class EmailTemplate {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  category: EmailTemplateCategory;
  variables: string[];
  isActive: boolean;
  description?: string;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    organizationId: string;
    name: string;
    subject: string;
    html: string;
    category: EmailTemplateCategory;
    variables: string[];
    createdBy: string;
    text?: string;
    isActive?: boolean;
    description?: string;
    usageCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.name = props.name;
    this.subject = props.subject;
    this.html = props.html;
    this.text = props.text;
    this.category = props.category;
    this.variables = props.variables;
    this.isActive = props.isActive ?? true;
    this.description = props.description;
    this.usageCount = props.usageCount ?? 0;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  incrementUsage(): void {
    this.usageCount++;
    this.updatedAt = new Date();
  }

  validate(): boolean {
    // Check if all variables in subject/html are in the variables list
    const variablePattern = /\{\{(\w+)\}\}/g;
    const usedVariables = new Set<string>();

    let match;
    while ((match = variablePattern.exec(this.subject)) !== null) {
      usedVariables.add(match[1]);
    }
    while ((match = variablePattern.exec(this.html)) !== null) {
      usedVariables.add(match[1]);
    }

    const declaredVariables = new Set(this.variables);
    for (const variable of usedVariables) {
      if (!declaredVariables.has(variable)) {
        return false;
      }
    }

    return true;
  }

  toObject() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      name: this.name,
      subject: this.subject,
      html: this.html,
      text: this.text,
      category: this.category,
      variables: this.variables,
      isActive: this.isActive,
      description: this.description,
      usageCount: this.usageCount,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
