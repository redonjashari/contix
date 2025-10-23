// src/controllers/admin.controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import AdminService from '../services/admin.service.js';
import VenueService from '../services/venue.service.js';
import { SeatService } from '../services/seat.service.js';
import { seatService } from '../services/seat.service.js';
import { EventService } from '../services/events.service.js';
import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';

export async function getSalesReport(
  request: FastifyRequest<{
    Querystring: { startDate?: string; endDate?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { startDate, endDate } = request.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return reply.code(400).send({ error: 'Invalid startDate or endDate' });
    }

    const report = await AdminService.getSalesReport(start, end);
    return reply.send({ report });
  } catch (err: any) {
    return reply.code(500).send({ error: err?.message ?? 'Failed to fetch sales report' });
  }
}

export async function getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const [userStats, eventStats] = await Promise.all([
      AdminService.getUserStats(),
      AdminService.getEventStats(),
    ]);

    return reply.send({
      users: userStats,
      events: eventStats,
    });
  } catch (err: any) {
    return reply.code(500).send({ error: err?.message ?? 'Failed to fetch dashboard stats' });
  }
}

export async function createVenue(
  request: FastifyRequest<{
    Body: { name: string; address: string; capacity: number };
  }>,
  reply: FastifyReply
) {
  try {
    const body = request.body ?? ({} as any);
    if (!body.name || !body.address || !Number.isInteger(body.capacity)) {
      return reply.code(400).send({ error: 'Invalid payload: name, address and integer capacity required' });
    }

    const venue = await VenueService.createVenue({
      name: body.name,
      address: body.address,
      capacity: body.capacity,
    });

    return reply.code(201).send({ venue });
  } catch (err: any) {
    return reply.code(400).send({ error: err?.message ?? 'Could not create venue' });
  }
}

export async function updateVenue(
  request: FastifyRequest<{
    Params: { id: string };
    Body: Partial<{ name: string; address: string; capacity: number }>;
  }>,
  reply: FastifyReply
) {
  try {
    const updates = request.body ?? {};
    const venue = await VenueService.updateVenue(request.params.id, updates);
    return reply.send({ venue });
  } catch (err: any) {
    // If the service throws "Venue not found" treat as 404
    const status = err?.message?.toLowerCase?.().includes('not found') ? 404 : 400;
    return reply.code(status).send({ error: err?.message ?? 'Could not update venue' });
  }
}

export async function bulkCreateSeats(
  request: FastifyRequest<{
    Params: { id: string }; // eventId
    Body: {
      seats: Array<{ section: string; row: string; number: string; price: number }>;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { id: eventId } = request.params;
    const { seats } = request.body ?? { seats: [] };

    if (!Array.isArray(seats) || seats.length === 0) {
      return reply.code(400).send({ error: 'seats must be a non-empty array' });
    }

    const result = await seatService.bulkCreateSeats(eventId, seats);

    // accept either { count } or an array of created seats
    const count = typeof result?.count === 'number' ? result.count : Array.isArray(result) ? result.length : undefined;

    if (typeof count === 'number') {
      return reply.code(201).send({ message: `Created ${count} seats`, count });
    }

    // fallback: send raw result if unknown shape
    return reply.code(201).send({ result });
  } catch (err: any) {
    return reply.code(400).send({ error: err?.message ?? 'Could not create seats' });
  }
}

export async function listUsers(
  request: FastifyRequest<{
    Querystring: { limit?: string; offset?: string; role?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const limit = Math.min(Math.max(parseInt((request.query.limit as any) || '20', 10), 1), 200);
    const offset = Math.max(parseInt((request.query.offset as any) || '0', 10), 0);
    const role = request.query.role as string | undefined;

    const where = role ? { role: role as any } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (err: any) {
    return reply.code(500).send({ error: err?.message ?? 'Could not list users' });
  }
}

export async function updateUserRole(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { role: 'USER' | 'ADMIN' };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { role } = request.body ?? {};

    if (role !== 'USER' && role !== 'ADMIN') {
      return reply.code(400).send({ error: 'role must be USER or ADMIN' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return reply.send({ user });
  } catch (err: any) {
    const status = (err?.message?.toLowerCase?.().includes('not found')) ? 404 : 400;
    return reply.code(status).send({ error: err?.message ?? 'Could not update user role' });
  }
}

export async function createEvent(
  request: FastifyRequest<{
    Body: {
      venueId: string;
      title: string;
      description: string;
      startAt: string;
      endAt: string;
      genre?: string;
      posterPath?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const body = request.body;
    const event = await EventService.createEvent(body);
    return reply.code(201).send(event);
  } catch (err: any) {
    return reply.code(400).send({ error: err?.message ?? 'Could not create event' });
  }
}

export async function updateEvent(
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      venueId?: string;
      title?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      genre?: string;
      posterPath?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const updates = request.body;
    const event = await EventService.updateEvent(id, updates);
    return reply.send(event);
  } catch (err: any) {
    const status = err?.message?.toLowerCase?.().includes('not found') ? 404 : 400;
    return reply.code(status).send({ error: err?.message ?? 'Could not update event' });
  }
}

export async function deleteEvent(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    await EventService.deleteEvent(id);
    return reply.code(204).send();
  } catch (err: any) {
    const status = err?.message?.toLowerCase?.().includes('not found') ? 404 : 400;
    return reply.code(status).send({ error: err?.message ?? 'Could not delete event' });
  }
}

export async function deleteVenue(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    await VenueService.deleteVenue(id);
    return reply.code(204).send();
  } catch (err: any) {
    const status = err?.message?.toLowerCase?.().includes('not found') ? 404 : 400;
    return reply.code(status).send({ error: err?.message ?? 'Could not delete venue' });
  }
}

export async function createSeats(
  request: FastifyRequest<{
    Params: { eventId: string };
    Body: {
      seats: Array<{ section: string; row: string; number: string; price: number }>;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { eventId } = request.params;
    const { seats } = request.body;
    const result = await seatService.bulkCreateSeats(eventId, seats);
    return reply.code(201).send(result);
  } catch (err: any) {
    return reply.code(400).send({ error: err?.message ?? 'Could not create seats' });
  }
}

export async function getUsers(
  request: FastifyRequest<{
    Querystring: { limit?: string; offset?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const limit = Math.min(Math.max(parseInt(request.query.limit || '20', 10), 1), 200);
    const offset = Math.max(parseInt(request.query.offset || '0', 10), 0);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(users);
  } catch (err: any) {
    return reply.code(500).send({ error: err?.message ?? 'Could not get users' });
  }
}

export async function getUserStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = await AdminService.getUserStats();
    return reply.send(stats);
  } catch (err: any) {
    return reply.code(500).send({ error: err?.message ?? 'Could not get user stats' });
  }
}
