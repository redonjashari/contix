import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 400,
    margin: 2,
  });
}

export function parseQRData(qrData: string): {
  ticketCode: string;
  orderId: string;
  seatId: string;
  issuedAt: string;
} {
  try {
    return JSON.parse(qrData);
  } catch {
    throw new Error('Invalid QR data format');
  }
}