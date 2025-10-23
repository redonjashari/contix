#!/bin/bash

# Contix Monitoring Script
set -e

echo "📊 Contix System Monitor"
echo "========================"

# Check if services are running
echo "🔍 Checking service status..."

# Check app container
if docker ps | grep -q "contix-app-prod"; then
    echo "✅ App container is running"
else
    echo "❌ App container is not running"
    exit 1
fi

# Check worker container
if docker ps | grep -q "contix-worker-prod"; then
    echo "✅ Worker container is running"
else
    echo "❌ Worker container is not running"
fi

# Check database
if docker ps | grep -q "contix-postgres-prod"; then
    echo "✅ Database container is running"
else
    echo "❌ Database container is not running"
    exit 1
fi

# Check Redis
if docker ps | grep -q "contix-redis-prod"; then
    echo "✅ Redis container is running"
else
    echo "❌ Redis container is not running"
fi

# Health check
echo "🏥 Performing health check..."
if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "✅ Application health check passed"
else
    echo "❌ Application health check failed"
    exit 1
fi

# Check disk usage
echo "💾 Checking disk usage..."
df -h | grep -E "(Filesystem|/dev/)"

# Check memory usage
echo "🧠 Checking memory usage..."
free -h

# Check container resource usage
echo "📈 Container resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# Check logs for errors
echo "📋 Checking recent logs for errors..."
docker-compose -f docker-compose.prod.yml logs --tail=50 app | grep -i error || echo "No errors found in recent logs"

echo "✅ Monitoring completed successfully"
