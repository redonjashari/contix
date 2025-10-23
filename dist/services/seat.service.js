// src/services/seat.service.ts
import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
// ----- Service -----
export class SeatService {
    /**
     * Creates a hold on multiple seats atomically using pessimistic locking.
     */
    async createHold(request) {
        const { userId, eventId, seatCodes, ttlSeconds = 600 } = request;
        if (!userId || !eventId || !Array.isArray(seatCodes) || seatCodes.length === 0) {
            throw new Error('Invalid hold request');
        }
        const holdToken = uuidv4();
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        const seatIdentifiers = seatCodes.map(code => {
            const [section, row, number] = code.split('-');
            return { section, row, number };
        });
        return await prisma.$transaction(async (tx) => {
            // Lock seats using FOR UPDATE (raw query) — make sure your DB table names match
            const seats = await tx.$queryRaw `
        SELECT id, section, row, number, price, status
        FROM seats
        WHERE event_id = ${eventId}
        AND (section, row, number) IN (${Prisma.join(seatIdentifiers.map(s => Prisma.sql `(${s.section}, ${s.row}, ${s.number})`))})
        FOR UPDATE
      `;
            if (seats.length !== seatCodes.length) {
                throw new Error('One or more seats not found');
            }
            const unavailableSeats = seats.filter((s) => s.status !== 'AVAILABLE');
            if (unavailableSeats.length > 0) {
                throw new Error(`Seats already taken: ${unavailableSeats
                    .map((s) => `${s.section}-${s.row}-${s.number}`)
                    .join(', ')}`);
            }
            const holdRecords = seats.map((seat) => ({
                id: uuidv4(),
                userId,
                eventId,
                seatId: seat.id,
                holdToken,
                expiresAt,
            }));
            await tx.hold.createMany({ data: holdRecords });
            await tx.seat.updateMany({
                where: { id: { in: seats.map((s) => s.id) } },
                data: { status: 'HELD' },
            });
            const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price), 0);
            return {
                holdToken,
                expiresAt,
                heldSeats: seats.map((seat) => ({
                    seatId: seat.id,
                    section: seat.section,
                    row: seat.row,
                    number: seat.number,
                    price: Number(seat.price),
                })),
                totalAmount,
            };
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000,
        });
    }
    /**
     * Bulk create seats for an event.
     * - Validates event existence
     * - Inserts in chunks to avoid parameter limits
     * - Sets default status to AVAILABLE
     * - Returns { count: number }
     */
    async bulkCreateSeats(eventId, seats) {
        if (!eventId)
            throw new Error('eventId required');
        if (!Array.isArray(seats) || seats.length === 0)
            throw new Error('seats must be a non-empty array');
        // Validate event exists
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
        if (!event)
            throw new Error('Event not found');
        // Prepare rows
        const rows = seats.map(s => {
            if (!s.section || !s.row || !s.number || typeof s.price !== 'number') {
                throw new Error('Each seat must have section, row, number and numeric price');
            }
            return {
                section: s.section,
                row: s.row,
                number: s.number,
                price: s.price,
                eventId,
                status: 'AVAILABLE',
            };
        });
        const chunkSize = 500;
        let totalInserted = 0;
        for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const res = await prisma.seat.createMany({
                data: chunk,
            });
            totalInserted += res.count ?? 0;
        }
        return { count: totalInserted };
    }
    /**
     * Validates a hold and returns held seat information.
     */
    async validateHold(holdToken, userId) {
        const holds = await prisma.hold.findMany({
            where: { holdToken, userId, expiresAt: { gt: new Date() } },
            include: { seat: true, event: true },
        });
        if (holds.length === 0) {
            throw new Error('Invalid or expired hold');
        }
        return {
            holds,
            totalAmount: holds.reduce((sum, h) => sum + Number(h.seat.price), 0),
            eventId: holds[0].eventId,
        };
    }
    /**
     * Releases expired holds and returns the number of released holds.
     * Called by background worker.
     */
    async releaseExpiredHolds() {
        const now = new Date();
        return await prisma.$transaction(async (tx) => {
            const expiredHolds = await tx.hold.findMany({
                where: { expiresAt: { lt: now } },
                select: { id: true, seatId: true },
            });
            if (expiredHolds.length === 0)
                return 0;
            const seatIds = expiredHolds.map(h => h.seatId);
            const holdIds = expiredHolds.map(h => h.id);
            await tx.hold.deleteMany({ where: { id: { in: holdIds } } });
            await tx.seat.updateMany({
                where: { id: { in: seatIds }, status: 'HELD' },
                data: { status: 'AVAILABLE' },
            });
            return expiredHolds.length;
        });
    }
    /**
     * Gets seat availability for an event.
     */
    async getEventSeats(eventId) {
        const seats = await prisma.seat.findMany({
            where: { eventId },
            orderBy: [{ section: 'asc' }, { row: 'asc' }, { number: 'asc' }],
        });
        const seatMap = seats.reduce((acc, seat) => {
            if (!acc[seat.section])
                acc[seat.section] = [];
            acc[seat.section].push({
                seatId: seat.id,
                section: seat.section,
                row: seat.row,
                number: seat.number,
                price: Number(seat.price),
            });
            return acc;
        }, {});
        return {
            eventId,
            sections: seatMap,
            summary: {
                total: seats.length,
                available: seats.filter(s => s.status === 'AVAILABLE').length,
                held: seats.filter(s => s.status === 'HELD').length,
                sold: seats.filter(s => s.status === 'SOLD').length,
            },
        };
    }
}
// Export class and default singleton
export default new SeatService();
export const seatService = new SeatService();
