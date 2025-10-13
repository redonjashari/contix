import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Complete Payment Flow', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let userId: string;
  let eventId: string;

  beforeAll(async () => {
    app = await buildApp();

    // Register and login
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'paymenttest@example.com',
        password: 'password123',
        name: 'Payment Test',
      },
    });

    const body = JSON.parse(registerResponse.body);
    accessToken = body.accessToken;
    userId = body.user.id;

    // Create a test event (would need admin access in real scenario)
    // For now, assume event exists from seed data
    const events = await prisma.event.findFirst();
    eventId = events!.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should complete full payment flow', async () => {
    // Step 1: Browse events
    const eventsResponse = await app.inject({
      method: 'GET',
      url: '/events',
    });
    expect(eventsResponse.statusCode).toBe(200);

    // Step 2: Get event seats
    const seatsResponse = await app.inject({
      method: 'GET',
      url: `/events/${eventId}/seats`,
    });
    expect(seatsResponse.statusCode).toBe(200);

    // Step 3: Create hold
    const holdResponse = await app.inject({
      method: 'POST',
      url: `/events/${eventId}/holds`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        seats: ['A-1-1', 'A-1-2'],
        ttlSeconds: 600,
      },
    });

    expect(holdResponse.statusCode).toBe(201);
    const holdData = JSON.parse(holdResponse.body);
    expect(holdData.holdToken).toBeDefined();
    expect(holdData.heldSeats).toHaveLength(2);

    // Step 4: Create payment intent
    const paymentIntentResponse = await app.inject({
      method: 'POST',
      url: '/payments/intent',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        holdToken: holdData.holdToken,
      },
    });

    expect(paymentIntentResponse.statusCode).toBe(200);
    const paymentData = JSON.parse(paymentIntentResponse.body);
    expect(paymentData.clientSecret).toBeDefined();
    expect(paymentData.orderId).toBeDefined();

    // Step 5: Verify hold is still valid
    const holdCheckResponse = await app.inject({
      method: 'GET',
      url: `/holds/${holdData.holdToken}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(holdCheckResponse.statusCode).toBe(200);
  });

  it('should reject expired holds', async () => {
    // Create hold with very short TTL
    const holdResponse = await app.inject({
      method: 'POST',
      url: `/events/${eventId}/holds`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        seats: ['B-1-1'],
        ttlSeconds: 1, // 1 second
      },
    });

    const holdData = JSON.parse(holdResponse.body);

    // Wait for hold to expire
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to create payment intent with expired hold
    const paymentIntentResponse = await app.inject({
      method: 'POST',
      url: '/payments/intent',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        holdToken: holdData.holdToken,
      },
    });

    expect(paymentIntentResponse.statusCode).toBe(400);
  });
});