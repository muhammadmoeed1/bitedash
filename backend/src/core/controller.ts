import { Request, Response } from 'express';
import { CrudService } from './service';
import { ResourceConfig } from './types';
import { validate } from '../utils/validate';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

function parsePagination(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE));
  return { page, pageSize };
}

function parseSort(req: Request) {
  const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  if (!sort) return {};
  const [sortField, sortDirection] = sort.split(':');
  return { sortField, sortDirection: sortDirection === 'desc' ? ('desc' as const) : ('asc' as const) };
}

function parseFilters(req: Request, filterableFields: readonly string[]): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  for (const field of filterableFields) {
    const value = req.query[field];
    if (value !== undefined) filters[field] = Number.isNaN(Number(value)) ? value : Number(value);
  }
  return filters;
}

function parseKeyParams(keys: readonly string[], params: Request['params']): Record<string, string> {
  const idParams: Record<string, string> = {};
  for (const key of keys) {
    const value = params[key];
    idParams[key] = Array.isArray(value) ? value[0] : (value ?? '');
  }
  return idParams;
}

/** Generic HTTP layer: parses the request, delegates to the service, and shapes the JSON response. */
export class CrudController<T, TCreate, TUpdate> {
  private readonly keys: readonly string[];

  constructor(
    private readonly service: CrudService<T, TCreate, TUpdate>,
    private readonly config: ResourceConfig<T, TCreate, TUpdate>,
  ) {
    this.keys = Array.isArray(config.primaryKey) ? config.primaryKey : [config.primaryKey as string];
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const { page, pageSize } = parsePagination(req);
    const { sortField, sortDirection } = parseSort(req);
    const filters = parseFilters(req, this.config.filterableFields ?? []);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const result = await this.service.list({ page, pageSize, sortField, sortDirection, filters, search });
    res.json(result);
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const idParams = parseKeyParams(this.keys, req.params);
    const data = await this.service.getById(idParams);
    res.json({ data });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = validate(this.config.createSchema, req.body);
    const data = await this.service.create(payload, req.user);
    res.status(201).json({ data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const idParams = parseKeyParams(this.keys, req.params);
    const payload = validate(this.config.updateSchema, req.body);
    const data = await this.service.update(idParams, payload, req.user);
    res.json({ data });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const idParams = parseKeyParams(this.keys, req.params);
    await this.service.remove(idParams, req.user);
    res.status(204).send();
  };
}
