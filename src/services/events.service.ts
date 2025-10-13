import prisma from '../config/database.js';


export const EventService = {
async listUpcoming(limit = 20) {
return prisma.event.findMany({
where: { startAt: { gte: new Date() } },
orderBy: { startAt: 'asc' },
take: limit,
});
},


async getById(id: string) {
return prisma.event.findUnique({ where: { id } });
},


// ... other helpers like create/update
};