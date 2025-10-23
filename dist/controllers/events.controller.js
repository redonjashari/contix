import { EventService } from '../services/events.service.js';
export const EventsController = {
    async listUpcoming(request, reply) {
        const events = await EventService.listUpcoming();
        reply.send(events);
    },
    async getById(request, reply) {
        const { id } = request.params;
        const event = await EventService.getById(id);
        if (!event)
            return reply.code(404).send({ error: 'Not found' });
        reply.send(event);
    },
};
