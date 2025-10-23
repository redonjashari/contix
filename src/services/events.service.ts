import prisma from '../config/database.js';
import { logger } from '../utils/logger.util.js';

export const EventService = {
  async listUpcoming(limit = 20) {
    return prisma.event.findMany({
      where: { startAt: { gte: new Date() } },
      orderBy: { startAt: 'asc' },
      take: limit,
      include: {
        venue: true,
        seats: {
          where: { status: 'AVAILABLE' },
          select: { id: true, section: true, row: true, number: true, price: true },
        },
      },
    });
  },

  async getById(id: string) {
    return prisma.event.findUnique({ 
      where: { id },
      include: {
        venue: true,
        seats: {
          select: { id: true, section: true, row: true, number: true, price: true, status: true },
        },
      },
    });
  },

  async createEvent(data: {
    venueId: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    genre?: string;
    posterPath?: string;
  }) {
    logger.info({ action: 'createEvent', title: data.title, venueId: data.venueId }, 'Creating event');

    const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
    if (!venue) throw new Error('Venue not found');

    const start = new Date(data.startAt);
    const end = new Date(data.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid start or end time');
    }
    if (start >= end) throw new Error('startAt must be before endAt');

    const event = await prisma.event.create({
      data: {
        venueId: data.venueId,
        title: data.title,
        description: data.description,
        startAt: start,
        endAt: end,
        genre: data.genre ?? null,
        posterPath: data.posterPath ?? null,
      },
      include: {
        venue: true,
      },
    });

    logger.info({ action: 'createEvent', eventId: event.id }, 'Event created');
    return event;
  },

  async updateEvent(id: string, updates: {
    venueId?: string;
    title?: string;
    description?: string;
    startAt?: string;
    endAt?: string;
    genre?: string;
    posterPath?: string;
  }) {
    logger.debug({ action: 'updateEvent', eventId: id }, 'Updating event');

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) throw new Error('Event not found');

    const dataToUpdate: any = {};
    if (updates.startAt) dataToUpdate.startAt = new Date(updates.startAt);
    if (updates.endAt) dataToUpdate.endAt = new Date(updates.endAt);
    if (dataToUpdate.startAt && dataToUpdate.endAt && dataToUpdate.startAt >= dataToUpdate.endAt) {
      throw new Error('startAt must be before endAt');
    }

    if (updates.venueId !== undefined) dataToUpdate.venueId = updates.venueId;
    if (updates.title !== undefined) dataToUpdate.title = updates.title;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.genre !== undefined) dataToUpdate.genre = updates.genre;
    if (updates.posterPath !== undefined) dataToUpdate.posterPath = updates.posterPath;

    const updated = await prisma.event.update({
      where: { id },
      data: dataToUpdate,
      include: {
        venue: true,
      },
    });

    logger.info({ action: 'updateEvent', eventId: id }, 'Event updated');
    return updated;
  },

  async deleteEvent(id: string) {
    logger.info({ action: 'deleteEvent', eventId: id }, 'Deleting event');

    const event = await prisma.event.findUnique({ 
      where: { id },
      include: { orders: true },
    });
    if (!event) throw new Error('Event not found');

    const hasPaidOrders = event.orders.some((o) => o.status === 'PAID');
    if (hasPaidOrders) {
      logger.warn({ action: 'deleteEvent', eventId: id }, 'Cannot delete event - it has paid orders');
      throw new Error('Cannot delete event: paid orders exist');
    }

    const deleted = await prisma.event.delete({ where: { id } });
    logger.info({ action: 'deleteEvent', eventId: id }, 'Event deleted');
    return deleted;
  },
};