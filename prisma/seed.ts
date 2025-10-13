import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@concert.com' },
    update: {},
    create: {
      email: 'admin@concert.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@concert.com' },
    update: {},
    create: {
      email: 'user@concert.com',
      passwordHash: userPassword,
      name: 'Test User',
      role: 'USER',
      isVerified: true,
    },
  });
  console.log('✅ Created test user:', user.email);

  // Create venues
  const venues = [
    {
      name: 'Madison Square Garden',
      address: '4 Pennsylvania Plaza, New York, NY 10001',
      capacity: 20000,
    },
    {
      name: 'Red Rocks Amphitheatre',
      address: '18300 W Alameda Pkwy, Morrison, CO 80465',
      capacity: 9525,
    },
    {
      name: 'Hollywood Bowl',
      address: '2301 N Highland Ave, Los Angeles, CA 90068',
      capacity: 17500,
    },
  ];

  const createdVenues = [];
  for (const venueData of venues) {
    const venue = await prisma.venue.upsert({
      where: { name: venueData.name },
      update: {},
      create: venueData,
    });
    createdVenues.push(venue);
    console.log('✅ Created venue:', venue.name);
  }

  // Create events
  const now = new Date();
  const events = [
    {
      venueId: createdVenues[0].id,
      title: 'Taylor Swift: The Eras Tour',
      description: 'Experience the magic of Taylor Swift live in concert!',
      startTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      genre: 'Pop',
      posterPath: '/posters/taylor-swift.jpg',
    },
    {
      venueId: createdVenues[1].id,
      title: 'Imagine Dragons: Mercury World Tour',
      description: 'Rock out with Imagine Dragons under the stars!',
      startTime: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      genre: 'Rock',
      posterPath: '/posters/imagine-dragons.jpg',
    },
    {
      venueId: createdVenues[2].id,
      title: 'Billie Eilish: Happier Than Ever Tour',
      description: "Don't miss Billie Eilish's electrifying performance!",
      startTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      genre: 'Alternative',
      posterPath: '/posters/billie-eilish.jpg',
    },
    {
      venueId: createdVenues[0].id,
      title: 'The Weeknd: After Hours Tour',
      description: 'Experience The Weeknd live in an unforgettable show!',
      startTime: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      genre: 'R&B',
      posterPath: '/posters/the-weeknd.jpg',
    },
  ];

  const createdEvents = [];
  for (const eventData of events) {
    const event = await prisma.event.create({
      data: eventData,
    });
    createdEvents.push(event);
    console.log('✅ Created event:', event.title);

    // Create seats for each event
    const sections = ['A', 'B', 'C'];
    const rowsPerSection = 10;
    const seatsPerRow = 20;
    const basePrices = { A: 150, B: 100, C: 75 };

    const seatData = [];
    for (const section of sections) {
      for (let row = 1; row <= rowsPerSection; row++) {
        for (let seat = 1; seat <= seatsPerRow; seat++) {
          seatData.push({
            eventId: event.id,
            section,
            row: row.toString(),
            number: seat.toString(),
            price: basePrices[section as keyof typeof basePrices],
            status: 'AVAILABLE',
            version: 0,
          });
        }
      }
    }

    await prisma.seat.createMany({
      data: seatData,
    });
    console.log(`  ✅ Created ${seatData.length} seats for ${event.title}`);
  }

  console.log('🎉 Seeding completed successfully!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@concert.com / admin123');
  console.log('User: user@concert.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
