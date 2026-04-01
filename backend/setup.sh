#!/bin/bash

# PhotoFlow Backend - Quick Start Script
echo "🚀 PhotoFlow Backend - Quick Start"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker version: $(docker -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Create uploads directory
if [ ! -d "uploads" ]; then
    echo ""
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
fi

# Start MongoDB
echo ""
echo "🐳 Starting MongoDB with Docker..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start MongoDB"
    exit 1
fi

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run start:dev"
echo ""
echo "The server will be available at:"
echo "  https://PhotoFlow.sonomainfotech.in/api"
echo ""
echo "To stop MongoDB:"
echo "  docker-compose down"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
