import { injectable, inject } from 'inversify';
import { QueryHandler } from '../../../../shared/application/base/query-handler';
import { Result } from '../../../../shared/application/base/result';
import { IntegrationTemplate } from '../../domain/entities/integration-template';
import { ListTemplatesQuery } from '../../application/queries/list-templates-query';
import type { IIntegrationTemplateRepository } from '../../domain/repositories/integration-template-repository';
import { IntegrationTemplateDto } from '../../application/dtos/integration-template-dto';

/**
 * List Templates Handler
 */
@injectable()
export class ListTemplatesHandler extends QueryHandler<ListTemplatesQuery, { templates: IntegrationTemplateDto[]; pagination: any }> {
  constructor(
    @inject('IntegrationTemplateRepository') private templateRepository: IIntegrationTemplateRepository
  ) {
    super();
  }

  async handle(query: ListTemplatesQuery): Promise<Result<{ templates: IntegrationTemplateDto[]; pagination: any }>> {
    const { templates, total } = await this.templateRepository.findAll({
      organizationId: query.props.organizationId,
      provider: query.props.provider,
      category: query.props.category,
      includeBuiltIn: true,
      includePublic: true,
      limit: query.props.limit,
      offset: (query.props.page! - 1) * query.props.limit!,
    });

    return Result.success({
      templates: templates.map((t) => new IntegrationTemplateDto({
        id: t.id.value,
        name: t.name,
        description: t.description,
        provider: t.provider,
        category: t.category,
        template: t.getTemplateAsObject(),
        isBuiltIn: t.isBuiltIn,
        isPublic: t.isPublic,
        organizationId: t.organizationId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        createdBy: t.createdBy,
      })),
      pagination: {
        page: query.props.page,
        limit: query.props.limit,
        total,
        pages: Math.ceil(total / query.props.limit!),
      },
    });
  }
}
