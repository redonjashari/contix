import { OrderService } from '../services/order.service.js';
export const OrdersController = {
    async create(request, reply) {
        try {
            const user = request.user;
            if (!user)
                return reply.code(401).send({ error: 'Unauthorized' });
            const body = request.body;
            const { items, totalInCents, currency, eventId: bodyEventId } = body ?? {};
            // Try to determine eventId: explicit body.eventId preferred, otherwise from first item
            const eventId = bodyEventId ?? items?.[0]?.eventId;
            if (!eventId) {
                return reply
                    .code(400)
                    .send({ error: 'Missing eventId. Provide body.eventId or include eventId on items[0].' });
            }
            if (typeof totalInCents !== 'number' || totalInCents <= 0) {
                return reply.code(400).send({ error: 'totalInCents must be a positive integer (cents).' });
            }
            // Build DTO for the service (matches OrderService.createOrder signature)
            const createOrderDto = {
                userId: user.id,
                eventId,
                totalInCents,
                currency: currency ?? 'usd',
            };
            const order = await OrderService.createOrder(createOrderDto);
            // Create a PaymentIntent for the new order (matches your service method)
            const { clientSecret } = await OrderService.createPaymentIntentForOrder(order.id, totalInCents, createOrderDto.currency);
            reply.code(201).send({ order, clientSecret });
        }
        catch (err) {
            // For debugging you can log err here, then return a safe message
            reply.code(400).send({ error: err?.message ?? 'Could not create order' });
        }
    },
};
