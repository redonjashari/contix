import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const app = Fastify({
  logger: true
});

// CORS
app.register(cors, {
  origin: 'http://localhost:3000',
  credentials: true,
});

// Health check
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Root endpoint
app.get('/', async (request, reply) => {
  return { 
    message: 'Contix Concert Ticket Platform API', 
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      events: '/events/*'
    }
  };
});

// Auth endpoints
app.post('/auth/register', async (request, reply) => {
  try {
    const { email, password, name } = request.body as any;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.code(400).send({ error: 'Email already in use' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: 'USER' }
    });
    
    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      { expiresIn: '7d' }
    );
    
    return reply.code(201).send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
});

app.post('/auth/login', async (request, reply) => {
  try {
    const { email, password } = request.body as any;
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      { expiresIn: '7d' }
    );
    
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
});

app.post('/auth/refresh', async (request, reply) => {
  try {
    const { refreshToken } = request.body as any;
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret') as any;
    
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      return reply.code(401).send({ error: 'Invalid refresh token' });
    }
    
    const newAccessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '15m' }
    );
    
    const newRefreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      { expiresIn: '7d' }
    );
    
    return reply.send({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    return reply.code(401).send({ error: 'Invalid refresh token' });
  }
});

// Events endpoint (mock data for now)
app.get('/events', async (request, reply) => {
  return reply.send([
    {
      id: '1',
      title: 'Taylor Swift: The Eras Tour',
      description: 'Experience the magic of Taylor Swift live in concert!',
      startAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      genre: 'Pop',
      venue: {
        id: '1',
        name: 'Madison Square Garden',
        address: '4 Pennsylvania Plaza, New York, NY 10001',
        capacity: 20789
      }
    }
  ]);
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Simple backend server running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
