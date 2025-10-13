// src/services/admin.service.ts
// Admin operations for events and user management.
//
// Exports AdminService with:
// - createEvent (optionally creates seats in bulk)
// - updateEvent
// - cancelEvent (mark event cancelled via endTime or soft-cancel pattern)
// - deleteEvent (safety checks against paid orders)
// - promoteUserToAdmin / demoteUser
// - createSeats (bulk create seats for an event)
//
// Notes:
// - Leverages prisma transactions for multi-step operations
// - Uses Seat.version optimistic locking value when updating seat records (if needed later)

import prisma from '../config/database.js';
import { logger, getLogger } from '../utils/logger.util.js';
import { Prisma } from '@prisma/client';

type SeatInput = {
  section: string;
  row: string;
  number: string;
  price: number; // decimal in dollars (or currency unit)
};

type CreateEventInput = {
  venueId: string;
  title: string;
  description: string;
  startTime: Date | string;
  endTime: Date | string;
  genre?: string | null;
  posterPath?: string | null;
  seats?: SeatInput[]; // optional — if provided we'll create seats in bulk
};

type SalesReport = {
  totalSalesInCents: number;
  ordersCount: number;
  avgOrderInCents: number | null;
  salesByEvent: Array<{
    eventId: string;
    title: string | null;
    totalInCents: number;
    ordersCount: number;
  }>;
  salesByVenue: Array<{
    venueId: string | null;
    name: string | null;
    totalInCents: number;
    ordersCount: number;
  }>;
  salesByDay: Array<{
    date: string; // YYYY-MM-DD
    totalInCents: number;
  }>;
};

type UpdateEventInput = Partial<CreateEventInput>;

export const AdminService = {
  /**
   * Create an event. Optionally accepts seats array to create seats immediately.
   * Uses a transaction so both event + seats are created atomically.
   */
  async createEvent(data: CreateEventInput) {
    logger.info({ action: 'createEvent', title: data.title, venueId: data.venueId }, 'Creating event');

    // validate basic things
    const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
    if (!venue) throw new Error('Venue not found');

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Invalid start or end time');
    if (start >= end) throw new Error('startTime must be before endTime');

    // create event and seats in transaction
    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          venueId: data.venueId,
          title: data.title,
          description: data.description,
          startTime: start,
          endTime: end,
          genre: data.genre ?? null,
          posterPath: data.posterPath ?? null,
        },
      });

      if (data.seats && data.seats.length > 0) {
        // prepare seat create data
        const seatCreates = data.seats.map((s) => ({
          eventId: event.id,
          section: s.section,
          row: s.row,
          number: s.number,
          price: new Prisma.Decimal(s.price.toFixed ? s.price.toFixed(2) : String(s.price)),
        }));

        // create many seats
        // Note: Prisma's createMany doesn't return created rows. If you need them, use loop or a batch
        await tx.seat.createMany({
          data: seatCreates,
          skipDuplicates: true, // skip on unique constraint collision
        });
      }

      return event;
    });

    logger.info({ action: 'createEvent', eventId: created.id }, 'Event created');
    return created;
  },

  /**
   * Update an event's basic fields (not seats).
   */
  async updateEvent(eventId: string, updates: UpdateEventInput) {
    logger.debug({ action: 'updateEvent', eventId }, 'Updating event');

    // check existence
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) throw new Error('Event not found');

    // validate times if provided
    const dataToUpdate: any = {};
    if (updates.startTime) dataToUpdate.startTime = new Date(updates.startTime as any);
    if (updates.endTime) dataToUpdate.endTime = new Date(updates.endTime as any);
    if (dataToUpdate.startTime && dataToUpdate.endTime && dataToUpdate.startTime >= dataToUpdate.endTime) {
      throw new Error('startTime must be before endTime');
    }

    if (updates.title !== undefined) dataToUpdate.title = updates.title;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.genre !== undefined) dataToUpdate.genre = updates.genre;
    if (updates.posterPath !== undefined) dataToUpdate.posterPath = updates.posterPath;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: dataToUpdate,
    });

    logger.info({ action: 'updateEvent', eventId }, 'Event updated');
    return updated;
  },

  /**
   * Cancel an event. Because `Event` has no status enum in schema, we will:
   * - Option A: set endTime to now (soft cancel) and optionally notify users.
   * - For safety we will not hard-delete events with paid orders.
   */
  async cancelEvent(eventId: string, reason?: string) {
    logger.info({ action: 'cancelEvent', eventId, reason }, 'Cancelling event');

    const existing = await prisma.event.findUnique({ where: { id: eventId }, include: { orders: true } });
    if (!existing) throw new Error('Event not found');

    const hasPaidOrders = existing.orders.some((o) => o.status === 'PAID');
    if (hasPaidOrders) {
      logger.warn({ action: 'cancelEvent', eventId }, 'Event has paid orders and cannot be cancelled automatically');
      throw new Error('Event has paid orders and cannot be cancelled');
    }

    // Set endTime to now to effectively cancel upcoming event
    const cancelled = await prisma.event.update({
      where: { id: eventId },
      data: { endTime: new Date() },
    });

    logger.info({ action: 'cancelEvent', eventId }, 'Event cancelled (endTime set to now)');
    return cancelled;
  },

  /**
   * Delete an event if it has no paid orders.
   * Uses transaction to ensure child rows are removed according to cascade rules.
   */
  async deleteEvent(eventId: string) {
    logger.info({ action: 'deleteEvent', eventId }, 'Deleting event (safety checks)');

    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { orders: true } });
    if (!event) throw new Error('Event not found');

    const hasPaidOrders = event.orders.some((o) => o.status === 'PAID');
    if (hasPaidOrders) {
      logger.warn({ action: 'deleteEvent', eventId }, 'Cannot delete event - it has paid orders');
      throw new Error('Cannot delete event: paid orders exist');
    }

    // Delete event (cascades seats/holds via schema cascade settings)
    const deleted = await prisma.$transaction(async (tx) => {
      // Optionally: delete payments/orders that are PENDING/CANCELED first
      // but here we rely on cascade where appropriate and let DB enforce constraints
      return tx.event.delete({ where: { id: eventId } });
    });

    logger.info({ action: 'deleteEvent', eventId }, 'Event deleted');
    return deleted;
  },

  /**
   * Bulk-create seats for an event. Uses createMany with skipDuplicates.
   * Returns the number of seats created (note: createMany doesn't return rows).
   */
  async createSeats(eventId: string, seats: SeatInput[]) {
    logger.info({ action: 'createSeats', eventId, count: seats.length }, 'Creating seats in bulk');

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    // validate seat inputs
    const createData = seats.map((s) => ({
      eventId,
      section: s.section,
      row: s.row,
      number: s.number,
      price: new Prisma.Decimal(s.price.toFixed ? s.price.toFixed(2) : String(s.price)),
    }));

    const res = await prisma.seat.createMany({
      data: createData,
      skipDuplicates: true,
    });

    logger.info({ action: 'createSeats', eventId, createdCount: res.count }, 'Seats created');
    return { createdCount: res.count ?? 0 };
  },

  /**
   * Promote a user to ADMIN role
   */
  async promoteUserToAdmin(userId: string) {
    logger.info({ action: 'promoteUser', userId }, 'Promoting user to ADMIN');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const updated = await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
    logger.info({ action: 'promoteUser', userId }, 'User promoted');
    return updated;
  },

  /**
   * Demote an admin to USER
   */
  async demoteUser(userId: string) {
    logger.info({ action: 'demoteUser', userId }, 'Demoting user to USER');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const updated = await prisma.user.update({ where: { id: userId }, data: { role: 'USER' } });
    logger.info({ action: 'demoteUser', userId }, 'User demoted');
    return updated;
  },

  async getSalesReport(start: Date, end: Date): Promise<SalesReport> {
    // Normalize input
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
      throw new Error('Invalid start date');
    }
    if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid end date');
    }

    // Ensure end includes the whole day if user passed a date without time
    const endInclusive = new Date(end);
    endInclusive.setHours(23, 59, 59, 999);

    logger.info({ action: 'getSalesReport', start: start.toISOString(), end: endInclusive.toISOString() }, 'Generating sales report');

    // Fetch PAID orders in range and include related event -> venue
    const orders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: start,
          lte: endInclusive,
        },
      },
      select: {
        id: true,
        totalAmount: true, // Prisma.Decimal
        currency: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            venueId: true,
          },
        },
      },
    });

    // Helper: convert Prisma.Decimal to cents (integer)
    const decimalToCents = (d: Prisma.Decimal | number | string) => {
      // decimal can be Prisma.Decimal; convert to string then float, multiply 100, round
      const asNum = typeof d === 'number' ? d : parseFloat(String(d));
      return Math.round(asNum * 100);
    };

    const ordersCount = orders.length;
    let totalSalesInCents = 0;

    // Aggregate by eventId and venueId/day
    const byEvent = new Map<string, { title: string | null; total: number; count: number }>();
    const byVenue = new Map<string | null, { name: string | null; total: number; count: number }>();
    const byDay = new Map<string, number>(); // date string -> total cents

    for (const o of orders) {
      const cents = decimalToCents(o.totalAmount);
      totalSalesInCents += cents;

      // event aggregation
      const ev = o.event;
      const eventId = ev?.id ?? 'unknown';
      const eventTitle = ev?.title ?? null;
      const existingEvent = byEvent.get(eventId);
      if (existingEvent) {
        existingEvent.total += cents;
        existingEvent.count += 1;
      } else {
        byEvent.set(eventId, { title: eventTitle, total: cents, count: 1 });
      }

      // venue aggregation (need to fetch venue name lazily)
      const venueId = ev?.venueId ?? null;
      const existingVenue = byVenue.get(venueId ?? null);
      if (existingVenue) {
        existingVenue.total += cents;
        existingVenue.count += 1;
      } else {
        byVenue.set(venueId ?? null, { name: null, total: cents, count: 1 });
      }

      // day aggregation (use UTC date to avoid timezone mismatch; or use server local if preferred)
      const dt = new Date(o.createdAt);
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      const dayKey = `${y}-${m}-${d}`;
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + cents);
    }

    // Resolve venue names for venue aggregation (bulk fetch)
    const venueIds = Array.from(new Set(Array.from(byVenue.keys()).filter((id): id is string => !!id)));
    if (venueIds.length > 0) {
      const venues = await prisma.venue.findMany({
        where: { id: { in: venueIds } },
        select: { id: true, name: true },
      });
      const nameMap = new Map(venues.map((v) => [v.id, v.name]));
      for (const vid of venueIds) {
        const entry = byVenue.get(vid) as { name: string | null; total: number; count: number } | undefined;
        if (entry) entry.name = nameMap.get(vid) ?? null;
      }
    }

    // Build output arrays sorted by totals desc
    const salesByEvent = Array.from(byEvent.entries())
      .map(([eventId, v]) => ({
        eventId,
        title: v.title,
        totalInCents: v.total,
        ordersCount: v.count,
      }))
      .sort((a, b) => b.totalInCents - a.totalInCents);

    const salesByVenue = Array.from(byVenue.entries())
      .map(([venueId, v]) => ({
        venueId,
        name: v.name,
        totalInCents: v.total,
        ordersCount: v.count,
      }))
      .sort((a, b) => (b.totalInCents ?? 0) - (a.totalInCents ?? 0));

    const salesByDay = Array.from(byDay.entries())
      .map(([date, totalInCents]) => ({ date, totalInCents }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const avgOrderInCents = ordersCount > 0 ? Math.round(totalSalesInCents / ordersCount) : null;

    const report: SalesReport = {
      totalSalesInCents,
      ordersCount,
      avgOrderInCents,
      salesByEvent,
      salesByVenue,
      salesByDay,
    };

    logger.info({ action: 'getSalesReport', reportSummary: { totalSalesInCents, ordersCount } }, 'Sales report generated');

    return report;
  },

  // --- optional: small helpers used by controller in other places. Keep minimal implementations ---
  async getUserStats() {
    // simple example: total users and new users in last 30 days
    const total = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    return { total, newUsers };
  },

  async getEventStats() {
    // simple example: total events and upcoming events
    const total = await prisma.event.count();
    const upcoming = await prisma.event.count({ where: { startTime: { gte: new Date() } } });
    return { total, upcoming };
  },
};

export default AdminService;
