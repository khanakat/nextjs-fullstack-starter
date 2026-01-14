/**
 * Comments Slice - Dependency Injection Types
 * Defines service identifiers for the Comments IoC container bindings
 */

export const CommentTypes = {
  // Repositories
  CommentRepository: Symbol.for('CommentRepository'),

  // Command Handlers
  CreateCommentHandler: Symbol.for('CreateCommentHandler'),
  UpdateCommentHandler: Symbol.for('UpdateCommentHandler'),
  DeleteCommentHandler: Symbol.for('DeleteCommentHandler'),
  AddReactionHandler: Symbol.for('AddReactionHandler'),
  RemoveReactionHandler: Symbol.for('RemoveReactionHandler'),

  // Query Handlers
  GetCommentHandler: Symbol.for('GetCommentHandler'),
  ListCommentsHandler: Symbol.for('ListCommentsHandler'),
  GetThreadHandler: Symbol.for('GetThreadHandler'),

  // Controllers
  CommentsApiController: Symbol.for('CommentsApiController'),
};
