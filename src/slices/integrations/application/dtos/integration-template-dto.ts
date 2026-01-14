/**
 * Integration Template DTO
 */
export class IntegrationTemplateDto {
  constructor(public readonly value: {
    id: string;
    name: string;
    description?: string;
    provider: string;
    category: string;
    template: any;
    isBuiltIn: boolean;
    isPublic: boolean;
    organizationId?: string | null;
    createdAt: Date;
    updatedAt?: Date;
    createdBy?: string;
  }) {}

  toObject(): Record<string, any> {
    return {
      id: this.value.id,
      name: this.value.name,
      description: this.value.description,
      provider: this.value.provider,
      category: this.value.category,
      template: this.value.template,
      isBuiltIn: this.value.isBuiltIn,
      isPublic: this.value.isPublic,
      isGlobal: this.value.isPublic,
      organizationId: this.value.organizationId,
      createdAt: this.value.createdAt,
      updatedAt: this.value.updatedAt,
      createdBy: this.value.createdBy,
    };
  }
}
