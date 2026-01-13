import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../../../shared/infrastructure/di/types';

// Domain Repositories
import type { IFileRepository } from '../../domain/repositories/file-repository';
import { PrismaFileRepository } from '../repositories/prisma-file-repository';

// Application Handlers
import { UploadFileHandler } from '../../application/handlers/upload-file-handler';
import { DeleteFileHandler } from '../../application/handlers/delete-file-handler';
import { UpdateFileUrlHandler } from '../../application/handlers/update-file-url-handler';
import { DeleteManyFilesHandler } from '../../application/handlers/delete-many-files-handler';
import { GetFileHandler } from '../../application/handlers/get-file-handler';
import { ListFilesHandler } from '../../application/handlers/list-files-handler';
import { GetFileStatisticsHandler } from '../../application/handlers/get-file-statistics-handler';

/**
 * Files Dependency Injection Container
 * Configures all dependencies for the files vertical slice
 */
export function configureFilesContainer(container: Container): void {
  // Domain Repositories
  container
    .bind<IFileRepository>(TYPES.FileRepository)
    .to(PrismaFileRepository)
    .inRequestScope();

  // Application Handlers
  container
    .bind<UploadFileHandler>(TYPES.UploadFileHandler)
    .to(UploadFileHandler)
    .inRequestScope();

  container
    .bind<DeleteFileHandler>(TYPES.DeleteFileHandler)
    .to(DeleteFileHandler)
    .inRequestScope();

  container
    .bind<UpdateFileUrlHandler>(TYPES.UpdateFileUrlHandler)
    .to(UpdateFileUrlHandler)
    .inRequestScope();

  container
    .bind<DeleteManyFilesHandler>(TYPES.DeleteManyFilesHandler)
    .to(DeleteManyFilesHandler)
    .inRequestScope();

  container
    .bind<GetFileHandler>(TYPES.GetFileHandler)
    .to(GetFileHandler)
    .inRequestScope();

  container
    .bind<ListFilesHandler>(TYPES.ListFilesHandler)
    .to(ListFilesHandler)
    .inRequestScope();

  container
    .bind<GetFileStatisticsHandler>(TYPES.GetFileStatisticsHandler)
    .to(GetFileStatisticsHandler)
    .inRequestScope();
}
