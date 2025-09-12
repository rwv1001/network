#!/bin/bash

# Network Identity Manager Deployment Script

set -e

echo "🚀 Starting Network Identity Manager deployment..."

# Check if required environment variables are set
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$JWT_SECRET" ] || [ -z "$AZURE_CLIENT_ID" ] || [ -z "$AZURE_CLIENT_SECRET" ] || [ -z "$AZURE_TENANT_ID" ]; then
    echo "❌ Required environment variables are not set!"
    echo "Please ensure the following variables are configured in .env:"
    echo "- JWT_SECRET"
    echo "- AZURE_CLIENT_ID"
    echo "- AZURE_CLIENT_SECRET"
    echo "- AZURE_TENANT_ID"
    exit 1
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose installation
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Build and start services
echo "🔧 Building and starting services..."
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Application is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Health check failed after 30 attempts"
        docker compose logs app
        exit 1
    fi
    echo "Attempt $i/30 - waiting for application..."
    sleep 2
done

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "  - API: http://localhost:3000"
echo "  - Health Check: http://localhost:3000/health"
echo "  - API Documentation: http://localhost:3000/"
echo ""
echo "📊 To view logs:"
echo "  docker compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "  docker compose down"