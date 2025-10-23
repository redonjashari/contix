import { PaymentService } from '../services/payment.service.js';
const paymentService = new PaymentService();
export async function createPaymentIntent(request, reply) {
    try {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        const { holdToken } = request.body;
        const result = await paymentService.createPaymentIntent(holdToken, user.id);
        reply.send(result);
    }
    catch (err) {
        reply.code(400).send({ error: err.message });
    }
}
export async function handleWebhook(request, reply) {
    try {
        const signature = request.headers['stripe-signature'];
        const payload = request.body;
        const result = await paymentService.handleWebhook(payload, signature);
        reply.send(result);
    }
    catch (err) {
        reply.code(400).send({ error: err.message });
    }
}
