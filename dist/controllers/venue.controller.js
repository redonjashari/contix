import VenueService from '../services/venue.service.js'; // default import (singleton)
export async function listVenues(request, reply) {
    try {
        const q = request.query?.q;
        const skip = parseInt((request.query?.skip ?? '0'), 10) || 0;
        const take = Math.min(parseInt((request.query?.take ?? '50'), 10) || 50, 200);
        const venues = await VenueService.listVenues({ skip, take, q });
        reply.send({ venues });
    }
    catch (err) {
        reply.code(500).send({ error: err.message });
    }
}
export async function getVenue(request, reply) {
    try {
        const includeEvents = (request.query?.includeEvents === '1');
        const venue = await VenueService.getVenueById(request.params.id, { includeEvents });
        reply.send({ venue });
    }
    catch (err) {
        reply.code(404).send({ error: err.message });
    }
}
