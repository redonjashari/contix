# 🎵 Contix - Concert Ticket Platform

A modern, full-stack concert ticket platform built with Node.js, TypeScript, React, and PostgreSQL. Contix provides a complete solution for discovering, purchasing, and managing concert tickets with real-time seat availability, secure payments, and digital ticket delivery.

## ✨ Features

### 🎫 Core Features
- **Event Discovery**: Browse upcoming concerts and events
- **Real-time Seat Selection**: Interactive seat map with live availability
- **Secure Payments**: Stripe integration for safe transactions
- **Digital Tickets**: QR code-based tickets for easy venue entry
- **User Management**: Registration, authentication, and profile management
- **Admin Dashboard**: Complete event and user management

### 🔧 Technical Features
- **Modern UI/UX**: Responsive design with Tailwind CSS and Framer Motion
- **Real-time Updates**: WebSocket support for live seat availability
- **Seat Holding**: Temporary seat reservations with automatic expiration
- **Payment Processing**: Stripe integration with webhook support
- **Background Jobs**: Automated cleanup of expired holds
- **Rate Limiting**: API protection against abuse
- **Health Monitoring**: Comprehensive health checks and monitoring

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Framework**: Fastify for high-performance API
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe integration
- **Caching**: Redis for session management
- **Background Jobs**: Node.js workers for cleanup tasks

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router for navigation
- **State Management**: Zustand for global state
- **Data Fetching**: React Query for server state
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth interactions

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for development and production
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **Monitoring**: Health checks and logging
- **Backup**: Automated database backups

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/redonjashari/contix.git
   cd contix
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   # Start database and Redis
   docker-compose up -d postgres redis
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database
   npm run prisma:seed
   
   # Start the backend
   npm run dev
   
   # In another terminal, start the frontend
   cd frontend && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Production Deployment

1. **Set up production environment variables**
   ```bash
   cp .env.production .env
   # Configure production values
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Build and deploy
   ./scripts/deploy.sh
   
   # Or manually
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Monitor the application**
   ```bash
   # Check system status
   ./scripts/monitor.sh
   
   # View logs
   npm run logs
   
   # Create backup
   ./scripts/backup.sh
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token

### Event Endpoints
- `GET /events` - List upcoming events
- `GET /events/:id` - Get event details
- `GET /events/:id/seats` - Get event seat availability

### Seat Management
- `POST /events/:id/holds` - Create seat hold
- `GET /holds/:token` - Check hold status

### Order & Payment
- `POST /orders` - Create order
- `POST /payments/intent` - Create payment intent
- `POST /payments/webhook` - Stripe webhook handler

### User Management
- `GET /users/me` - Get current user
- `PUT /users/me` - Update user profile

### Tickets
- `GET /tickets/my-tickets` - Get user tickets
- `GET /tickets/:code` - Get ticket by code
- `POST /tickets/:code/scan` - Scan ticket

### Admin Endpoints
- `GET /admin/users` - List users
- `GET /admin/stats/users` - User statistics
- `POST /admin/events` - Create event
- `PUT /admin/events/:id` - Update event
- `DELETE /admin/events/:id` - Delete event
- `POST /admin/venues` - Create venue
- `POST /admin/events/:id/seats` - Create seats

## 🗄️ Database Schema

### Core Entities
- **Users**: User accounts with authentication
- **Events**: Concert events with venue and timing
- **Venues**: Concert venues with capacity
- **Seats**: Individual seats with pricing and status
- **Orders**: Purchase orders with payment status
- **Tickets**: Digital tickets with QR codes
- **Holds**: Temporary seat reservations

### Key Relationships
- Users can have multiple orders and tickets
- Events belong to venues and have many seats
- Orders contain multiple tickets
- Holds temporarily reserve seats

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Zod schema validation
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers
- **Stripe Security**: PCI-compliant payment processing

## 📊 Monitoring & Maintenance

### Health Checks
- Application health endpoint: `/health`
- Database connectivity checks
- Redis connectivity checks
- Container health monitoring

### Logging
- Structured logging with Pino
- Request/response logging
- Error tracking and monitoring
- Performance metrics

### Backup & Recovery
- Automated database backups
- Point-in-time recovery
- Data retention policies
- Cloud storage integration

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Test Coverage
- Unit tests for services and utilities
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Database transaction testing

## 🚀 Performance Optimization

### Backend Optimizations
- Database indexing for fast queries
- Connection pooling for database efficiency
- Redis caching for session management
- Background job processing
- API response compression

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization and CDN
- Bundle size optimization
- Caching strategies
- Progressive Web App features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints
- Check the health status

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Social features and sharing
- [ ] Multi-language support
- [ ] Advanced seat pricing
- [ ] Event recommendations
- [ ] Email notifications
- [ ] SMS notifications

### Technical Improvements
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Real-time notifications
- [ ] Advanced caching
- [ ] CDN integration
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Performance monitoring

---

**Built with ❤️ for music lovers everywhere**
Testing...
