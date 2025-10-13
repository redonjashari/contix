// src/controllers/venue.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import VenueService from '../services/venue.service.js'; // default import (singleton)

export async function listVenues(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const q = (request.query as any)?.q;
    const skip = parseInt(((request.query as any)?.skip ?? '0'), 10) || 0;
    const take = Math.min(parseInt(((request.query as any)?.take ?? '50'), 10) || 50, 200);

    const venues = await VenueService.listVenues({ skip, take, q });
    reply.send({ venues });
  } catch (err: any) {
    reply.code(500).send({ error: err.message });
  }
}

export async function getVenue(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { includeEvents?: '1' | '0' };
  }>,
  reply: FastifyReply
) {
  try {
    const includeEvents = (request.query?.includeEvents === '1');
    const venue = await VenueService.getVenueById(request.params.id, { includeEvents });
    reply.send({ venue });
  } catch (err: any) {
    reply.code(404).send({ error: err.message });
  }
}
