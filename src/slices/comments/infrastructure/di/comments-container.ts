import { Container } from 'inversify';
import { CommentTypes } from '@/shared/infrastructure/di/comments.types';

// Domain Repositories
import { ICommentRepository } from '@/shared/domain/comments/repositories/icomment.repository';

// Infrastructure Repositories
import { PrismaCommentRepository } from '@/shared/infrastructure/comments/repositories/prisma-comment.repository';

// Application Handlers (Commands)
import { CreateCommentHandler } from '@/shared/application/comments/handlers/create-comment.handler';
import { UpdateCommentHandler } from '@/shared/application/comments/handlers/update-comment.handler';
import { DeleteCommentHandler } from '@/shared/application/comments/handlers/delete-comment.handler';
import { AddReactionHandler } from '@/shared/application/comments/handlers/add-reaction.handler';
import { RemoveReactionHandler } from '@/shared/application/comments/handlers/remove-reaction.handler';

// Application Handlers (Queries)
import { GetCommentHandler } from '@/shared/application/comments/handlers/get-comment.handler';
import { ListCommentsHandler } from '@/shared/application/comments/handlers/list-comments.handler';
import { GetThreadHandler } from '@/shared/application/comments/handlers/get-thread.handler';

// Presentation Controllers
import { CommentsApiController } from '../../presentation/controllers/comments-api.controller';

// External
import { PrismaClient } from '@prisma/client';

/**
 * Comments Dependency Injection Container
 * Configures all dependencies for the comments vertical slice
 */
export function configureCommentsContainer(container: Container): void {
  // Get Prisma client from container
  const prismaClient = container.get<PrismaClient>(Symbol.for('PrismaClient'));

  // Repository
  container.bind<ICommentRepository>(CommentTypes.CommentRepository).toDynamicValue(() => {
    return new PrismaCommentRepository();
  });

  // Command Handlers
  container.bind<CreateCommentHandler>(CommentTypes.CreateCommentHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new CreateCommentHandler(repo);
  });

  container.bind<UpdateCommentHandler>(CommentTypes.UpdateCommentHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new UpdateCommentHandler(repo);
  });

  container.bind<DeleteCommentHandler>(CommentTypes.DeleteCommentHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new DeleteCommentHandler(repo);
  });

  container.bind<AddReactionHandler>(CommentTypes.AddReactionHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new AddReactionHandler(repo);
  });

  container.bind<RemoveReactionHandler>(CommentTypes.RemoveReactionHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new RemoveReactionHandler(repo);
  });

  // Query Handlers
  container.bind<GetCommentHandler>(CommentTypes.GetCommentHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new GetCommentHandler(repo);
  });

  container.bind<ListCommentsHandler>(CommentTypes.ListCommentsHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new ListCommentsHandler(repo);
  });

  container.bind<GetThreadHandler>(CommentTypes.GetThreadHandler).toDynamicValue(() => {
    const repo = container.get<ICommentRepository>(CommentTypes.CommentRepository);
    return new GetThreadHandler(repo);
  });

  // Controllers
  container.bind<CommentsApiController>(CommentTypes.CommentsApiController).toDynamicValue(() => {
    const createHandler = container.get<CreateCommentHandler>(CommentTypes.CreateCommentHandler);
    const updateHandler = container.get<UpdateCommentHandler>(CommentTypes.UpdateCommentHandler);
    const deleteHandler = container.get<DeleteCommentHandler>(CommentTypes.DeleteCommentHandler);
    const addReactionHandler = container.get<AddReactionHandler>(CommentTypes.AddReactionHandler);
    const removeReactionHandler = container.get<RemoveReactionHandler>(CommentTypes.RemoveReactionHandler);
    const getCommentHandler = container.get<GetCommentHandler>(CommentTypes.GetCommentHandler);
    const listCommentsHandler = container.get<ListCommentsHandler>(CommentTypes.ListCommentsHandler);
    const getThreadHandler = container.get<GetThreadHandler>(CommentTypes.GetThreadHandler);

    return new CommentsApiController(
      createHandler,
      updateHandler,
      deleteHandler,
      addReactionHandler,
      removeReactionHandler,
      getCommentHandler,
      listCommentsHandler,
      getThreadHandler
    );
  });
}
