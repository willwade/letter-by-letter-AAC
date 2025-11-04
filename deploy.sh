#!/bin/bash

# Deployment script for Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION] [METHOD]
# METHOD: 'cloudbuild' (default) or 'local'

set -e

# Default values
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-west1"}
METHOD=${3:-"cloudbuild"}
SERVICE_NAME="spelling-aac-with-prediction"

echo "🚀 Deploying to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Method: $METHOD"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📝 Setting project..."
gcloud config set project $PROJECT_ID

if [ "$METHOD" = "cloudbuild" ]; then
    # Method 1: Use Cloud Build (recommended - simpler)
    echo "🏗️  Building and deploying with Cloud Build..."
    gcloud run deploy $SERVICE_NAME \
        --source . \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10

elif [ "$METHOD" = "local" ]; then
    # Method 2: Build locally and push to Artifact Registry
    echo "🏗️  Building Docker image locally..."
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

    # Build the image
    docker build -t $IMAGE_NAME .

    # Configure Docker to use gcloud as credential helper
    gcloud auth configure-docker

    # Push the image
    echo "📤 Pushing image to Container Registry..."
    docker push $IMAGE_NAME

    # Deploy to Cloud Run
    echo "🚀 Deploying to Cloud Run..."
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10
else
    echo "❌ Error: Invalid method '$METHOD'. Use 'cloudbuild' or 'local'."
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo "Your app should be available at the URL shown above."

