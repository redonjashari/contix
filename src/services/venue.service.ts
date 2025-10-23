// src/services/venue.service.ts
// Venue CRUD and helpers for the concert platform.
//
// Exports VenueService with:
// - createVenue
// - updateVenue
// - deleteVenue (fails if events with paid orders exist)
// - getVenueById
// - listVenues
// - getEventsForVenue
//
// Notes:
// - Uses prisma from src/config/database
// - Logs important actions with logger

import prisma from '../config/database.js';
import { logger } from '../utils/logger.util.js';
import { Prisma } from '@prisma/client';

type CreateVenueInput = {
  name: string;
  address: string;
  capacity: number;
};

type UpdateVenueInput = Partial<CreateVenueInput>;

export const VenueService = {
  /**
   * Create a new venue
   */
  async createVenue(data: CreateVenueInput) {
    logger.info({ action: 'createVenue', venue: data.name }, 'Creating venue');
    if (!data.name || !data.address || !Number.isInteger(data.capacity) || data.capacity < 0) {
      throw new Error('Invalid venue data');
    }

    const venue = await prisma.venue.create({
      data: {
        name: data.name,
        address: data.address,
        capacity: data.capacity,
      },
    });

    logger.info({ action: 'createVenue', venueId: venue.id }, 'Venue created');
    return venue;
  },

  /**
   * Update an existing venue
   */
  async updateVenue(venueId: string, updates: UpdateVenueInput) {
    logger.debug({ action: 'updateVenue', venueId, updates }, 'Updating venue');

    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new Error('Venue not found');

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;

    const updated = await prisma.venue.update({
      where: { id: venueId },
      data: updateData,
    });

    logger.info({ action: 'updateVenue', venueId }, 'Venue updated');
    return updated;
  },

  /**
   * Delete a venue.
   * Safety: prevents deleting if the venue has events that have PAID orders.
   * If no blocking orders exist, deletes venue and cascades related events/seats (per prisma schema).
   */
  async deleteVenue(venueId: string) {
    logger.info({ action: 'deleteVenue', venueId }, 'Deleting venue (starting checks)');

    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new Error('Venue not found');

    // Check for events with paid orders
    const eventsWithPaidOrders = await prisma.event.findMany({
      where: {
        venueId,
        orders: { some: { status: 'PAID' } }, // uses OrderStatus enum string
      },
      select: { id: true, title: true },
    });

    if (eventsWithPaidOrders.length > 0) {
      const ids = eventsWithPaidOrders.map(e => e.id).join(', ');
      logger.warn({ action: 'deleteVenue', venueId, blockingEvents: ids }, 'Cannot delete venue - paid orders exist');
      throw new Error('Cannot delete venue: one or more events have paid orders');
    }

    // Safe to delete in a transaction
    const deleted = await prisma.$transaction(async (tx) => {
      // Deleting the venue will cascade to events/seats if your schema has cascade rules.
      return tx.venue.delete({ where: { id: venueId } });
    });

    logger.info({ action: 'deleteVenue', venueId }, 'Venue deleted');
    return deleted;
  },

  /**
   * Get venue by id (with optional relations)
   */
  async getVenueById(venueId: string, opts?: { includeEvents?: boolean }) {
    const query: any = { where: { id: venueId } };
    if (opts?.includeEvents) {
      query.include = { events: true };
    }
    
    const venue = await prisma.venue.findUnique(query);
    if (!venue) throw new Error('Venue not found');
    return venue;
  },

  /**
   * List venues (paginated)
   */
  async listVenues(opts?: { skip?: number; take?: number; q?: string }) {
    const where: Prisma.VenueWhereInput | undefined = opts?.q
      ? { OR: [{ name: { contains: opts.q } }, { address: { contains: opts.q } }] }
      : undefined;

    const query: any = {
      skip: opts?.skip,
      take: opts?.take ?? 50,
      orderBy: { createdAt: 'desc' },
    };
    if (where) {
      query.where = where;
    }

    const venues = await prisma.venue.findMany(query);

    return venues;
  },

  /**
   * Get events for a particular venue (paginated)
   */
  async getEventsForVenue(venueId: string, opts?: { upcomingOnly?: boolean; skip?: number; take?: number }) {
    const where: Prisma.EventWhereInput = { venueId };
    if (opts?.upcomingOnly) {
      where.startAt = { gte: new Date() };
    }

    const query: any = {
      where,
      take: opts?.take ?? 50,
      orderBy: { startAt: 'asc' },
    };
    if (opts?.skip !== undefined) {
      query.skip = opts.skip;
    }

    const events = await prisma.event.findMany(query);

    return events;
  },
};

export default VenueService;
