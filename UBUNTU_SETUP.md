# Ubuntu Step-by-Step Deployment Guide

Follow these steps to deploy the AI Blog Generator Platform on a fresh Ubuntu system.

## Step 1: Install System Prerequisites

Open your terminal and run the following commands to install Docker, Kind, and Kubectl.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# NOTE: You may need to log out and log back in for group changes to take effect

# Install Kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Kind (Kubernetes in Docker)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

---

## Step 2: Clone and Prepare Environment

```bash
# Clone the repository (Replace with your actual repo URL)
# git clone <your-repo-url>
# cd <repo-folder>

# Create .env file
cp .env.example .env

# EDIT THE .env FILE
# nano .env
# Add your GEMINI_API_KEY="your_actual_key_here"
```

---

## Step 3: Option A - Deploy using Docker Compose (Recommended for Practice)

This is the fastest way to see the app running.

```bash
# Build and start all services
docker-compose up --build -d

# Check running containers
docker ps
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

---

## Step 4: Option B - Full Kubernetes Deployment (Advanced Practice)

### 4.1 Create Kind Cluster
```bash
kind create cluster --name ai-blog-cluster
```

### 4.2 Load Docker Images into Kind
```bash
# Build images locally first
docker build -t ai-blog-backend:latest ./backend
docker build -t ai-blog-frontend:latest ./frontend

# Load them into the cluster
kind load docker-image ai-blog-backend:latest --name ai-blog-cluster
kind load docker-image ai-blog-frontend:latest --name ai-blog-cluster
```

### 4.3 Apply Kubernetes Manifests
```bash
# 1. Create Namespace and ConfigMaps
kubectl apply -f k8s/base.yaml

# 2. Create Secret for Gemini API Key
# Replace <YOUR_KEY> with your actual Gemini API Key
kubectl create secret generic blog-secrets --from-literal=gemini-api-key=<YOUR_KEY> -n ai-blog-platform

# 3. Deploy MySQL
kubectl apply -f k8s/mysql.yaml

# 4. Deploy Backend and Frontend
kubectl apply -f k8s/apps.yaml

# 5. Deploy Ingress and Monitoring
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/monitoring.yaml
```

---

## Step 5: Verify and Access the App

### Check Resource Status
```bash
kubectl get all -n ai-blog-platform
```

### Access the Application
Since we are using Kind, we need to port-forward to access the services locally.

```bash
# Access Frontend
kubectl port-forward svc/frontend-service 3000:3000 -n ai-blog-platform &

# Access Backend
kubectl port-forward svc/backend-service 8000:8000 -n ai-blog-platform &
```

---

## Step 6: Access Monitoring (Prometheus & Grafana)

```bash
# Port-forward Prometheus
kubectl port-forward svc/prometheus-service 9090:9090 -n ai-blog-platform &

# Port-forward Grafana
kubectl port-forward svc/grafana-service 3001:3000 -n ai-blog-platform &
```
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (Default login: admin/admin)

---

## Step 7: Cleanup

To remove everything when you are done:

```bash
# If using Docker Compose
docker-compose down

# If using Kubernetes
kind delete cluster --name ai-blog-cluster
```
