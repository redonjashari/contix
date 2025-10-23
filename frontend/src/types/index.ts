export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  isVerified: boolean
  createdAt: string
}

export interface Venue {
  id: string
  name: string
  address: string
  capacity: number
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  description: string
  startAt: string
  endAt: string
  genre?: string
  posterPath?: string
  venue: Venue
  seats?: Seat[]
  createdAt: string
  updatedAt: string
}

export interface Seat {
  id: string
  section: string
  row: string
  number: string
  price: number
  status: 'AVAILABLE' | 'HELD' | 'SOLD'
  eventId: string
}

export interface Hold {
  holdToken: string
  expiresAt: string
  heldSeats: {
    seatId: string
    section: string
    row: string
    number: string
    price: number
  }[]
  totalAmount: number
}

export interface Order {
  id: string
  userId: string
  eventId: string
  totalAmount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'CANCELED' | 'REFUNDED'
  paymentProvider?: string
  paymentProviderRef?: string
  holdToken?: string
  createdAt: string
  updatedAt: string
  event?: Event
  tickets?: Ticket[]
}

export interface Ticket {
  id: string
  orderId: string
  seatId: string
  ticketCode: string
  qrData: string
  isScanned: boolean
  scannedAt?: string
  issuedAt: string
  seat: Seat
  order: Order
}

export interface PaymentIntent {
  clientSecret: string
  orderId: string
  amount: number
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface CreateHoldRequest {
  seats: string[]
  ttlSeconds?: number
}

export interface CreateOrderRequest {
  items: Array<{
    seatId: string
    eventId: string
  }>
  totalInCents: number
  currency?: string
  eventId: string
}

export interface ApiError {
  error: string
  message?: string
  details?: any
}
