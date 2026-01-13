import { Dto } from '../../../../shared/application/base/dto';
import { OrganizationStatus, OrganizationRole } from '../../domain/entities/organization';

/**
 * Organization Data Transfer Object
 * Used to transfer organization data between layers
 */
export interface OrganizationDtoProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  role: OrganizationRole;
  status: OrganizationStatus;
  maxMembers: number;
  plan: string;
  settings: string;
}

export class OrganizationDto extends Dto {
  public readonly name: string;
  public readonly slug: string;
  public readonly description?: string;
  public readonly imageUrl?: string;
  public readonly website?: string;
  public readonly role: OrganizationRole;
  public readonly status: OrganizationStatus;
  public readonly maxMembers: number;
  public readonly plan: string;
  public readonly settings: string;

  constructor(
    id: string,
    name: string,
    slug: string,
    description: string | undefined,
    imageUrl: string | undefined,
    website: string | undefined,
    role: OrganizationRole,
    status: OrganizationStatus,
    maxMembers: number,
    plan: string,
    settings: string,
    createdAt: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.imageUrl = imageUrl;
    this.website = website;
    this.role = role;
    this.status = status;
    this.maxMembers = maxMembers;
    this.plan = plan;
    this.settings = settings;
  }

  /**
   * Create DTO from domain entity
   */
  static fromEntity(organization: any): OrganizationDto {
    return new OrganizationDto(
      organization.id.value,
      organization.name,
      organization.slug,
      organization.description,
      organization.imageUrl,
      organization.website,
      organization.role,
      organization.status,
      organization.maxMembers,
      organization.plan,
      organization.settings,
      new Date(), // Use current time for now
      undefined
    );
  }

  /**
   * Create DTO list from domain entities
   */
  static fromEntities(organizations: any[]): OrganizationDto[] {
    return organizations.map((org) => OrganizationDto.fromEntity(org));
  }

  /**
   * Converts DTO to plain object
   */
  public toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      imageUrl: this.imageUrl,
      website: this.website,
      role: this.role,
      status: this.status,
      maxMembers: this.maxMembers,
      plan: this.plan,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
