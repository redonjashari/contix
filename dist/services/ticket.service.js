// src/services/ticket.service.ts
import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../config/database.js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
export class TicketService {
    /**
     * Generates a ticket with QR code for a seat.
     * tx should be the Prisma transaction client (Prisma.TransactionClient)
     */
    async generateTicket(tx, orderId, seatId) {
        const ticketCode = uuidv4();
        const qrPayload = JSON.stringify({
            ticketCode,
            orderId,
            seatId,
            issuedAt: new Date().toISOString(),
        });
        // Generate QR code as a Data URL (SVG/PNG depending on library settings)
        const qrData = await QRCode.toDataURL(qrPayload);
        const ticket = await tx.ticket.create({
            data: {
                orderId,
                seatId,
                ticketCode,
                qrData,
            },
        });
        return ticket;
    }
    /**
     * Return all tickets for an order id
     */
    async getOrderTickets(orderId) {
        const tickets = await prisma.ticket.findMany({
            where: { orderId },
            include: {
                seat: true,
                order: {
                    include: {
                        event: true,
                        user: true,
                    },
                },
            },
        });
        return tickets;
    }
    /**
     * Get all tickets for a user
     */
    async getTicketsByUser(userId) {
        const tickets = await prisma.ticket.findMany({
            where: {
                order: {
                    userId,
                },
            },
            include: {
                seat: true,
                order: {
                    include: {
                        event: true,
                        user: true,
                    },
                },
            },
            orderBy: {
                issuedAt: 'desc',
            },
        });
        return tickets;
    }
    /**
     * Fetch ticket by its code (includes order, seat, event, user)
     */
    async getTicketByCode(ticketCode) {
        const ticket = await prisma.ticket.findUnique({
            where: { ticketCode },
            include: {
                order: {
                    include: {
                        event: true,
                        user: true,
                    },
                },
                seat: true,
            },
        });
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        return ticket;
    }
    /**
     * Validates and scans a ticket atomically.
     * Returns { valid: boolean, ticket: updatedTicket }
     */
    async scanTicket(ticketCode) {
        return await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findUnique({
                where: { ticketCode },
                include: {
                    order: {
                        include: { event: true, user: true },
                    },
                    seat: true,
                },
            });
            if (!ticket) {
                throw new Error('Ticket not found');
            }
            if (ticket.isScanned) {
                throw new Error('Ticket already scanned');
            }
            if (!ticket.order || ticket.order.status !== 'PAID') {
                throw new Error('Order not paid');
            }
            const updated = await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    isScanned: true,
                    scannedAt: new Date(),
                },
                include: {
                    order: {
                        include: { event: true, user: true },
                    },
                    seat: true,
                },
            });
            return {
                valid: true,
                ticket: updated,
            };
        });
    }
}
// default export if you prefer singleton usage:
export const ticketService = new TicketService();
