import { RequestHandler, Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth, requireRole } from '../middleware/auth';
import { CrudController } from './controller';
import { CrudRepository } from './repository';
import { CrudService } from './service';
import { ResourceConfig, WriteProtection } from './types';

function protectionMiddleware(protection?: WriteProtection): RequestHandler[] {
  if (!protection) return [];
  return [requireAuth, requireRole(...protection.roles)];
}

/** Wires repository -> service -> controller for one resource and returns its Express router. */
export function createCrudRouter<T, TCreate, TUpdate>(config: ResourceConfig<T, TCreate, TUpdate>): Router {
  const repository = new CrudRepository<T>(config.delegate, config.primaryKey);
  const service = new CrudService<T, TCreate, TUpdate>(repository, config);
  const controller = new CrudController<T, TCreate, TUpdate>(service, config);

  const keys = Array.isArray(config.primaryKey) ? config.primaryKey : [config.primaryKey as string];
  const idPath = keys.map((key) => `:${key}`).join('/');

  const router = Router();
  // Reads are always public (browsing restaurants/menus doesn't require an account).
  router.get('/', asyncHandler(controller.list));
  router.get(`/${idPath}`, asyncHandler(controller.getOne));

  router.post('/', ...protectionMiddleware(config.protect?.create), asyncHandler(controller.create));
  router.patch(
    `/${idPath}`,
    ...protectionMiddleware(config.protect?.update),
    asyncHandler(controller.update),
  );
  router.delete(
    `/${idPath}`,
    ...protectionMiddleware(config.protect?.remove),
    asyncHandler(controller.remove),
  );

  return router;
}
