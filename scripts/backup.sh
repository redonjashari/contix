#!/bin/bash

# Contix Database Backup Script
set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="contix_backup_${DATE}.sql"

echo "🗄️ Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
echo "📦 Creating database backup..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U concert_user -d concert_db > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
echo "🗜️ Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Remove backups older than 7 days
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR -name "contix_backup_*.sql.gz" -mtime +7 -delete

echo "✅ Backup completed: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# Optional: Upload to cloud storage
# echo "☁️ Uploading to cloud storage..."
# aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" s3://your-backup-bucket/
