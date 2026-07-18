import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { CrudController } from './controller';
import { CrudRepository } from './repository';
import { CrudService } from './service';
import { ResourceConfig } from './types';

/** Wires repository -> service -> controller for one resource and returns its Express router. */
export function createCrudRouter<T, TCreate, TUpdate>(config: ResourceConfig<T, TCreate, TUpdate>): Router {
  const repository = new CrudRepository<T>(config.delegate, config.primaryKey);
  const service = new CrudService<T, TCreate, TUpdate>(repository, config);
  const controller = new CrudController<T, TCreate, TUpdate>(service, config);

  const keys = Array.isArray(config.primaryKey) ? config.primaryKey : [config.primaryKey as string];
  const idPath = keys.map((key) => `:${key}`).join('/');

  const router = Router();
  router.get('/', asyncHandler(controller.list));
  router.post('/', asyncHandler(controller.create));
  router.get(`/${idPath}`, asyncHandler(controller.getOne));
  router.patch(`/${idPath}`, asyncHandler(controller.update));
  router.delete(`/${idPath}`, asyncHandler(controller.remove));

  return router;
}
