# End-to-End Architecture Documentation

## Overview
The AI Blog Generator Platform is a multi-tier application designed for scalability, observability, and automated delivery. It leverages LLMs (Gemini API) for content generation and follows modern DevOps/LLMOps patterns.

## 🏗️ System Architecture

### 1. Frontend Layer (Streamlit / React)
- **Streamlit**: Used for the production-ready Python UI.
- **React**: Used for the AI Studio preview environment.
- **Responsibilities**: User interaction, session management, calling Gemini API (frontend-side), and displaying blog content.

### 2. Backend Layer (FastAPI)
- **Framework**: FastAPI (Asynchronous Python).
- **Responsibilities**: 
  - JWT Authentication (Register/Login).
  - Blog metadata storage and retrieval.
  - User history management.
  - Health checks and API documentation (Swagger).

### 3. Database Layer (MySQL)
- **Engine**: MySQL 8.0.
- **Schema**:
  - `users`: Stores credentials and profile info.
  - `blogs`: Stores generated content, SEO metadata, and ownership links.

### 4. LLM Service Layer (Gemini API)
- **Model**: `gemini-1.5-flash` (Production) / `gemini-3.1-pro-preview` (Preview).
- **Pattern**: Frontend-side invocation for secure API key handling in managed environments.

## 🎡 DevOps & Infrastructure

### 🐳 Containerization
- **Docker**: Each service (Frontend, Backend) has its own Dockerfile.
- **Docker Compose**: Orchestrates the full stack (App + DB) for local development.

### ☸️ Kubernetes (K8s)
- **Cluster**: `kind` (Kubernetes in Docker) for local K8s testing.
- **Ingress**: Nginx Ingress Controller routes traffic to Frontend (`/`) and Backend (`/api`).
- **StatefulSet**: Used for MySQL to ensure data persistence.
- **Deployments**: Used for stateless Frontend and Backend services with horizontal scaling (2 replicas).

### 📊 Monitoring & Observability
- **Prometheus**: Scrapes metrics from the services.
- **Grafana**: Visualizes system health and LLM usage metrics.

### 🔄 CI/CD Pipeline
- **GitHub Actions**: 
  - **CI**: Runs on every PR/Push to validate code, install dependencies, and build images.
  - **CD**: (Conceptual) Pushes images to a registry and triggers K8s updates.

## 🧠 LLMOps Workflow
1. **Prompt Engineering**: Dynamic templates optimized for SEO.
2. **Token Tracking**: Mocked in the UI to demonstrate usage monitoring.
3. **Error Handling**: Robust retry logic and validation of LLM responses.
