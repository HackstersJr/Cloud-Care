#!/bin/bash

# CloudCare Wearables Integration Setup Script
echo "🏥 CloudCare Wearables Integration Setup"
echo "========================================"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your specific configuration"
fi

# Create wearables .env file if it doesn't exist
if [ ! -f wearables/.env ]; then
    echo "📝 Creating wearables .env file..."
    cp wearables/.env.example wearables/.env
fi

# Check if service-account.json exists, create placeholder if not
if [ ! -f wearables/service-account.json ]; then
    echo "📝 Creating placeholder service-account.json..."
    echo '{}' > wearables/service-account.json
    echo "⚠️  For Firebase push notifications, replace wearables/service-account.json with your Firebase service account key"
fi

echo ""
echo "🚀 Starting CloudCare with Wearables Integration..."
echo "Services starting:"
echo "  - PostgreSQL (Port 5432)"
echo "  - Redis (Port 6379)"
echo "  - MongoDB (Port 27017)"
echo "  - CloudCare Backend (Port 3000)"
echo "  - Wearables Service (Port 6644)"
echo ""

# Start all services
docker-compose up -d

# Wait a moment for services to start
sleep 5

echo ""
echo "🔍 Checking service health..."

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker services are starting up"
else
    echo "❌ Some services failed to start"
    docker-compose logs
    exit 1
fi

# Wait for services to be fully ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health endpoints
echo "🏥 Checking CloudCare backend health..."
if curl -s http://localhost:3000/health >/dev/null; then
    echo "✅ CloudCare backend is healthy"
else
    echo "⚠️  CloudCare backend is still starting up"
fi

echo "🔗 Checking wearables service health..."
if curl -s http://localhost:6644/health >/dev/null; then
    echo "✅ Wearables service is healthy"
else
    echo "⚠️  Wearables service is still starting up"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Access your services:"
echo "  🌐 CloudCare API: http://localhost:3000"
echo "  💓 Wearables API: http://localhost:6644"
echo "  📊 PostgreSQL: localhost:5432"
echo "  🗄️  MongoDB: localhost:27017"
echo "  ⚡ Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "  1. Start the frontend: cd ../frontend && npm run dev"
echo "  2. Access the frontend: http://localhost:5174"
echo "  3. Navigate to /wearables to test the integration"
echo ""
echo "To stop all services: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo ""
echo "📚 Documentation: ./docs/WEARABLES_INTEGRATION.md"
