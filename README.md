# AI Blog Generator Platform

A production-ready Full Stack LLM application for generating SEO-friendly blogs using Gemini API, FastAPI, and Streamlit.

## 🚀 Features
- **User Authentication**: JWT-based register/login.
- **AI Blog Generation**: Long-form, SEO-optimized blogs using Gemini 1.5 Flash.
- **Blog Management**: Save, view history, and delete blogs.
- **SEO Ready**: Automatic title and meta description generation.
- **Containerized**: Full setup with Docker and Docker Compose.

## 🔄 CI/CD & DevOps
- **GitHub Actions**: Automated pipeline in `.github/workflows/main.yml` for building and testing.
- **Kubernetes (K8s)**: Manifests provided in `k8s/` for deployment using `kind` or any K8s cluster.
- **Monitoring**: Prometheus and Grafana setup included in `k8s/monitoring.yaml`.
- **Ingress**: Configured via `k8s/ingress.yaml` for unified access.

## 🏗️ Architecture
See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed end-to-end system design.

## 🛠️ Setup Instructions

### Local Installation (Script)
Run the provided installation script:
```bash
chmod +x install_locally.sh
./install_locally.sh
```

### Docker Compose
```bash
docker-compose up --build
```

### Kubernetes Deployment (Kind)
1. **Create Cluster**: `kind create cluster --name ai-blog`
2. **Apply Manifests**:
   ```bash
   kubectl apply -f k8s/base.yaml
   kubectl create secret generic blog-secrets --from-literal=gemini-api-key=YOUR_KEY -n ai-blog-platform
   kubectl apply -f k8s/mysql.yaml
   kubectl apply -f k8s/apps.yaml
   kubectl apply -f k8s/ingress.yaml
   kubectl apply -f k8s/monitoring.yaml
   ```

## 📊 Monitoring Access
Once deployed to K8s:
- **Prometheus**: `kubectl port-forward svc/prometheus-service 9090:9090 -n ai-blog-platform`
- **Grafana**: `kubectl port-forward svc/grafana-service 3001:3000 -n ai-blog-platform` (Access at http://localhost:3001)

## 📁 Project Structure
- `backend/`: FastAPI application, models, routes, and services.
- `frontend/`: Streamlit UI application.
- `docker-compose.yml`: Orchestration for MySQL, Backend, and Frontend.
- `requirements.txt`: Python dependencies.

## 🧠 LLMOps Practices
- **Prompt Engineering**: Dynamic templates for high-quality SEO content.
- **Service Layer**: Decoupled LLM logic for better maintainability.
- **Error Handling**: Robust handling of API failures and retries.
- **Logging**: Detailed logs for LLM requests and responses.
