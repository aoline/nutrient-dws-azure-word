#!/bin/bash

echo "🚀 Starting Express.js Server for Nutrient.io DWS Add-in"
echo "========================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Navigate to the .vercel directory
cd .vercel

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in .vercel directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if environment variables are set
echo "🔧 Checking environment variables..."
if [ -z "$NUTRIENT_DWS_API_KEY" ]; then
    echo "⚠️  NUTRIENT_DWS_API_KEY is not set"
    echo "   You can set it with: export NUTRIENT_DWS_API_KEY=your_key_here"
else
    echo "✅ NUTRIENT_DWS_API_KEY is configured"
fi

if [ -z "$NUTRIENT_VIEWER_API_KEY" ]; then
    echo "⚠️  NUTRIENT_VIEWER_API_KEY is not set"
    echo "   You can set it with: export NUTRIENT_VIEWER_API_KEY=your_key_here"
else
    echo "✅ NUTRIENT_VIEWER_API_KEY is configured"
fi

# Check if dist directory exists
if [ ! -d "../dist" ]; then
    echo "❌ dist directory not found. Please build the project first."
    echo "   Run: npm run build"
    exit 1
fi

echo "✅ dist directory found"

# Start the server
echo ""
echo "🚀 Starting Express.js server..."
echo "   Server will be available at: http://localhost:3000"
echo "   Health check: http://localhost:3000/health"
echo "   API status: http://localhost:3000/api/status"
echo "   Add-in: http://localhost:3000/minimal.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start 