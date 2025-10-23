import { logger } from './logger.util.js';
/**
 * Sends order confirmation email with tickets.
 * In production, integrate with SendGrid, AWS SES, or similar.
 */
export async function sendOrderConfirmation(data) {
    // TODO: Implement actual email sending
    // For development, just log
    logger.info({
        to: data.userEmail,
        subject: `Your tickets for ${data.eventTitle}`,
        orderId: data.orderId,
        ticketCount: data.tickets.length,
    }, 'Order confirmation email');
    // In production:
    // await sendgrid.send({
    //   to: data.userEmail,
    //   from: 'tickets@concert.com',
    //   subject: `Your tickets for ${data.eventTitle}`,
    //   html: generateEmailHTML(data),
    //   attachments: data.tickets.map(t => ({
    //     filename: `ticket-${t.seatSection}${t.seatRow}${t.seatNumber}.png`,
    //     content: t.qrCode,
    //     type: 'image/png',
    //   })),
    // });
}
