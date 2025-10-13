import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clean up database before each test suite
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

// Clean up after all tests
afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Reset database between tests (optional)
beforeEach(async () => {
  // You can clean specific tables here if needed
});