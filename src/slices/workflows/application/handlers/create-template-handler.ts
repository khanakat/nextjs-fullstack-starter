import { injectable, inject } from 'inversify';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { Result } from '../../../../shared/application/base/result';
import { WorkflowTemplate } from '../../domain/entities/workflow-template';
import { CreateWorkflowTemplateCommand } from '../commands/create-template-command';
import type { IWorkflowTemplateRepository } from '../../domain/repositories/workflow-template-repository';
import { WorkflowTemplateDto } from '../dtos/workflow-template-dto';

/**
 * Create Workflow Template Handler
 * Handles the creation of new workflow templates
 */
@injectable()
export class CreateWorkflowTemplateHandler extends CommandHandler<CreateWorkflowTemplateCommand, WorkflowTemplateDto> {
  constructor(
    @inject('WorkflowTemplateRepository') private templateRepository: IWorkflowTemplateRepository
  ) {
    super();
  }

  async handle(command: CreateWorkflowTemplateCommand): Promise<Result<WorkflowTemplateDto>> {
    // Validate command
    const validationResult = this.validate(command);
    if (!validationResult.isValid) {
      return Result.failure<WorkflowTemplateDto>(new Error(validationResult.errors.join(', ')));
    }

    // Create workflow template entity
    const template = WorkflowTemplate.create({
      workflowId: command.props.workflowId,
      name: command.props.name,
      description: command.props.description,
      category: command.props.category,
      template: JSON.stringify(command.props.template),
      variables: JSON.stringify(command.props.variables),
      settings: JSON.stringify(command.props.settings),
      isBuiltIn: command.props.isBuiltIn || false,
      isPublic: command.props.isPublic || false,
      tags: JSON.stringify(command.props.tags),
      usageCount: 0,
      rating: undefined,
      createdBy: command.props.createdBy || command.userId,
      organizationId: command.props.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save template
    await this.templateRepository.save(template);

    // Return DTO
    return Result.success(this.toDto(template));
  }

  private validate(command: CreateWorkflowTemplateCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.props.name || command.props.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!command.props.category || command.props.category.trim() === '') {
      errors.push('Category is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private toDto(template: WorkflowTemplate): WorkflowTemplateDto {
    const persistence = template.toPersistence();
    return new WorkflowTemplateDto({
      id: persistence.id,
      workflowId: persistence.workflowId,
      name: persistence.name,
      description: persistence.description,
      category: persistence.category,
      template: persistence.template,
      variables: persistence.variables,
      settings: persistence.settings,
      isBuiltIn: persistence.isBuiltIn,
      isPublic: persistence.isPublic,
      tags: persistence.tags,
      usageCount: persistence.usageCount,
      rating: persistence.rating,
      createdBy: persistence.createdBy,
      organizationId: persistence.organizationId,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    });
  }
}
