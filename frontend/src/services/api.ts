import axios, { AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import { 
  User, 
  Event, 
  Seat, 
  Hold, 
  Order, 
  Ticket, 
  Venue,
  PaymentIntent,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  CreateHoldRequest,
  CreateOrderRequest,
  ApiError
} from '../types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    const errorMessage = error.response?.data?.error || error.message || 'An error occurred'
    toast.error(errorMessage)
    
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', data),
  
  register: (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', data),
  
  refresh: (refreshToken: string): Promise<AxiosResponse<{ accessToken: string; refreshToken: string }>> =>
    api.post('/auth/refresh', { refreshToken }),
  
  getCurrentUser: (): Promise<AxiosResponse<User>> =>
    api.get('/users/me'),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<User>> =>
    api.put('/users/me', data),
}

// Events API
export const eventsApi = {
  getEvents: (): Promise<AxiosResponse<Event[]>> =>
    api.get('/events'),
  
  getEvent: (id: string): Promise<AxiosResponse<Event>> =>
    api.get(`/events/${id}`),
  
  getEventSeats: (eventId: string): Promise<AxiosResponse<{ eventId: string; sections: Record<string, Seat[]>; summary: { total: number; available: number; held: number; sold: number } }>> =>
    api.get(`/events/${eventId}/seats`),
}

// Holds API
export const holdsApi = {
  createHold: (eventId: string, data: CreateHoldRequest): Promise<AxiosResponse<Hold>> =>
    api.post(`/events/${eventId}/holds`, data),
  
  getHold: (holdToken: string): Promise<AxiosResponse<Hold & { valid: boolean }>> =>
    api.get(`/holds/${holdToken}`),
}

// Orders API
export const ordersApi = {
  createOrder: (data: CreateOrderRequest): Promise<AxiosResponse<{ order: Order; clientSecret: string }>> =>
    api.post('/orders', data),
  
  getOrders: (): Promise<AxiosResponse<Order[]>> =>
    api.get('/orders'),
}

// Payments API
export const paymentsApi = {
  createPaymentIntent: (holdToken: string): Promise<AxiosResponse<PaymentIntent>> =>
    api.post('/payments/intent', { holdToken }),
}

// Tickets API
export const ticketsApi = {
  getMyTickets: (): Promise<AxiosResponse<Ticket[]>> =>
    api.get('/tickets/my-tickets'),
  
  getTicket: (code: string): Promise<AxiosResponse<Ticket>> =>
    api.get(`/tickets/${code}`),
  
  scanTicket: (code: string): Promise<AxiosResponse<{ success: boolean; message: string; ticket: Ticket }>> =>
    api.post(`/tickets/${code}/scan`),
}

// Venues API
export const venuesApi = {
  getVenues: (): Promise<AxiosResponse<Venue[]>> =>
    api.get('/venues'),
  
  getVenue: (id: string, includeEvents?: boolean): Promise<AxiosResponse<Venue & { events?: Event[] }>> =>
    api.get(`/venues/${id}`, { params: { includeEvents: includeEvents ? '1' : '0' } }),
}

// Admin API
export const adminApi = {
  getUsers: (limit?: number, offset?: number): Promise<AxiosResponse<User[]>> =>
    api.get('/admin/users', { params: { limit, offset } }),
  
  getUserStats: (): Promise<AxiosResponse<{ total: number; verified: number; unverified: number; admins: number }>> =>
    api.get('/admin/stats/users'),
  
  createEvent: (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'venue'> & { venueId: string }): Promise<AxiosResponse<Event>> =>
    api.post('/admin/events', data),
  
  updateEvent: (id: string, data: Partial<Event>): Promise<AxiosResponse<Event>> =>
    api.put(`/admin/events/${id}`, data),
  
  deleteEvent: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/admin/events/${id}`),
  
  createVenue: (data: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<Venue>> =>
    api.post('/admin/venues', data),
  
  updateVenue: (id: string, data: Partial<Venue>): Promise<AxiosResponse<Venue>> =>
    api.put(`/admin/venues/${id}`, data),
  
  deleteVenue: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/admin/venues/${id}`),
  
  createSeats: (eventId: string, seats: Array<{ section: string; row: string; number: string; price: number }>): Promise<AxiosResponse<{ count: number }>> =>
    api.post(`/admin/events/${eventId}/seats`, { seats }),
}

export default api
