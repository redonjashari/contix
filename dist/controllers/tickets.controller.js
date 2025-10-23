import { TicketService } from '../services/ticket.service.js';
const ticketService = new TicketService();
export async function getTicketsByUser(request, reply) {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const tickets = await ticketService.getTicketsByUser(user.id);
        reply.send(tickets);
    }
    catch (err) {
        reply.code(404).send({ error: err.message });
    }
}
export async function getTicketByCode(request, reply) {
    try {
        const ticket = await ticketService.getTicketByCode(request.params.code);
        reply.send(ticket);
    }
    catch (err) {
        reply.code(404).send({ error: err.message });
    }
}
export async function scanTicket(request, reply) {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const result = await ticketService.scanTicket(request.params.code);
        reply.send(result);
    }
    catch (err) {
        reply.code(400).send({ error: err.message });
    }
}
