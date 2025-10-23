#!/bin/bash

# Contix Production Deployment Script
set -e

echo "🚀 Starting Contix deployment..."

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ POSTGRES_PASSWORD environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET environment variable is required"
    exit 1
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ JWT_REFRESH_SECRET environment variable is required"
    exit 1
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ STRIPE_SECRET_KEY environment variable is required"
    exit 1
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "❌ STRIPE_WEBHOOK_SECRET environment variable is required"
    exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ FRONTEND_URL environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"

# Build the application
echo "🔨 Building application..."
npm run build

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed database (optional)
echo "🌱 Seeding database..."
docker-compose -f docker-compose.prod.yml exec app npx prisma db seed || true

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3001/health; then
    echo "✅ Application is healthy"
else
    echo "❌ Health check failed"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Application is running at: $FRONTEND_URL"
echo "🔍 Check logs with: npm run logs"
