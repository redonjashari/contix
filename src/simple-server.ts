import Fastify from 'fastify';

const app = Fastify({
  logger: true
});

// Root endpoint
app.get('/', async (request, reply) => {
  return { 
    message: 'Contix Concert Ticket Platform API', 
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/api/test'
    }
  };
});

// Health check endpoint
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Simple test endpoint
app.get('/api/test', async (request, reply) => {
  return { message: 'Backend is working!' };
});

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server listening at http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
