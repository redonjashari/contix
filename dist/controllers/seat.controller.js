import { SeatService } from '../services/seat.service.js';
const seatService = new SeatService();
export async function getEventSeats(request, reply) {
    try {
        const { eventId } = request.params;
        const result = await seatService.getEventSeats(eventId);
        reply.send(result);
    }
    catch (err) {
        reply.code(404).send({ error: err.message });
    }
}
