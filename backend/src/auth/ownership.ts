import { prisma } from '../lib/prisma';
import type { Actor } from '../core/types';

/**
 * Resolves the id of the business entity an authenticated user owns (their own customer_id,
 * restaurant_id, or agent_id), used to check per-row ownership on write operations. Returns
 * null for admins (who bypass ownership checks entirely) or accounts with no linked profile.
 */
export async function resolveOwnedEntityId(actor: Actor): Promise<number | null> {
  switch (actor.role) {
    case 'customer': {
      const row = await prisma.customers.findUnique({ where: { user_id: actor.userId } });
      return row?.customer_id ?? null;
    }
    case 'restaurant_owner': {
      const row = await prisma.restaurants.findUnique({ where: { owner_user_id: actor.userId } });
      return row?.restaurant_id ?? null;
    }
    case 'delivery_agent': {
      const row = await prisma.delivery_agents.findUnique({ where: { user_id: actor.userId } });
      return row?.agent_id ?? null;
    }
    case 'admin':
      return null;
  }
}
