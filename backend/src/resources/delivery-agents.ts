import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createCrudRouter } from '../core/router';
import { PrismaDelegate, ResourceConfig } from '../core/types';
import type { delivery_agentsModel } from '../generated/prisma/models/delivery_agents';

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(20),
  vehicle_number: z.string().trim().max(50).optional(),
});

const updateSchema = createSchema.partial();

export type DeliveryAgentCreate = z.infer<typeof createSchema>;
export type DeliveryAgentUpdate = z.infer<typeof updateSchema>;

export const config: ResourceConfig<delivery_agentsModel, DeliveryAgentCreate, DeliveryAgentUpdate> = {
  name: 'delivery agent',
  path: 'delivery-agents',
  delegate: prisma.delivery_agents as unknown as PrismaDelegate<delivery_agentsModel>,
  primaryKey: 'agent_id',
  createSchema,
  updateSchema,
  filterableFields: [],
  sortableFields: ['agent_id', 'name'],
  defaultSort: { agent_id: 'asc' },
  protect: {
    // Onboarding an agent normally happens via /api/v1/auth/register (role: delivery_agent).
    create: { roles: ['admin'] },
    update: { roles: ['delivery_agent', 'admin'], ownerField: 'agent_id' },
    remove: { roles: ['admin'] },
  },
};

export const deliveryAgentsRouter = createCrudRouter<
  delivery_agentsModel,
  DeliveryAgentCreate,
  DeliveryAgentUpdate
>(config);
