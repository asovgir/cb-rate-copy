#!/bin/bash

# Cloudbeds Rate Copier - Quick Start Script

echo "🏨 Cloudbeds Rate Copier - Quick Start"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

echo "✓ Python found: $(python3 --version)"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

echo ""

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo ""

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✓ Setup complete!"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "Please create a .env file with your Cloudbeds Bearer token:"
    echo ""
    echo "CLOUDBEDS_TOKEN=your_bearer_token_here"
    echo ""
    echo "You can copy .env.example to .env and update it:"
    echo "cp .env.example .env"
    echo ""
else
    echo "✓ .env file found"
    echo ""
    echo "🚀 Starting application..."
    echo ""
    python app.py
fi