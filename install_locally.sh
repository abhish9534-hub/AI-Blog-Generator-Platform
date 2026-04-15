#!/bin/bash

# AI Blog Generator Platform - Local Installation Script

echo "🚀 Starting local installation..."

# 1. Check for prerequisites
command -v docker >/dev/null 2>&1 || { echo >&2 "❌ Docker is required but not installed. Aborting."; exit 1; }
command -v kind >/dev/null 2>&1 || { echo >&2 "⚠️ Kind is recommended for K8s deployment."; }

# 2. Setup Environment
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️ Please edit .env and add your GEMINI_API_KEY before running docker-compose."
fi

# 3. Option: Docker Compose
echo "🐳 To start the app using Docker Compose, run:"
echo "   docker-compose up --build"

# 4. Option: Kubernetes (Kind)
echo "☸️ To deploy to a local Kind cluster:"
echo "   1. kind create cluster --name ai-blog-cluster"
echo "   2. kubectl apply -f k8s/base.yaml"
echo "   3. kubectl create secret generic blog-secrets --from-literal=gemini-api-key=\$GEMINI_API_KEY -n ai-blog-platform"
echo "   4. kubectl apply -f k8s/mysql.yaml"
echo "   5. kubectl apply -f k8s/apps.yaml"
echo "   6. kubectl apply -f k8s/ingress.yaml"
echo "   7. kubectl apply -f k8s/monitoring.yaml"

echo "✅ Installation script finished."
