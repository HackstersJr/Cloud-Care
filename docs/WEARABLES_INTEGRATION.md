# Wearables Integration Setup

This document explains how to set up and configure the wearables service integration with Cloud-Care.

## Architecture

The wearables service is integrated as a separate Docker container that runs alongside the main Cloud-Care backend. It provides health data synchronization capabilities for various wearable devices.

## Docker Services

The integration adds two new services to the docker-compose.yml:

1. **wearables-db**: MongoDB database for storing encrypted health data
   - Port: 27017 (bound to 192.168.137.1:27017)
   - Credentials: root/iotopia
   - Database: hcgateway

2. **wearables**: Python Flask API service
   - Port: 6644 (bound to 192.168.137.1:6644)
   - API Version: v2 (/api/v2/)
   - Health endpoint: /health

## Configuration

### Backend Environment Variables

Add these to your `.env` file:

```bash
# Wearables Service Configuration
WEARABLES_SERVICE_URL=http://wearables:6644
WEARABLES_SERVICE_ENABLED=true
```

### Frontend Environment Variables

Add these to your `.env` file:

```bash
# For local development with Docker
VITE_WEARABLES_SERVICE_URL=http://localhost:6644

# For production deployment  
# VITE_WEARABLES_SERVICE_URL=https://cloudcare-backend-644000971069.asia-south1.run.app/api/v1/wearables
```

### Wearables Service Configuration

The wearables service uses its own `.env` file located at `backend/wearables/.env`:

```bash
APP_HOST=0.0.0.0
APP_PORT=6644
APP_DEBUG=False
MONGO_URI=mongodb://root:iotopia@wearables-db:27017/hcgateway?authSource=admin
SENTRY_DSN=  # Optional
FCM_PROJECT_ID=  # Optional, for push notifications
```

## API Endpoints

The wearables service provides the following API endpoints:

### Authentication
- `POST /api/v2/login` - Login with username/password
- `POST /api/v2/refresh` - Refresh authentication token
- `DELETE /api/v2/revoke` - Revoke authentication

### Data Synchronization
- `POST /api/v2/sync/{method}` - Upload health data
- `DELETE /api/v2/sync/{method}` - Delete health data from database

### Data Retrieval
- `POST /api/v2/fetch/{method}` - Fetch health data with queries

### Device Communication
- `PUT /api/v2/push/{method}` - Push data to device
- `DELETE /api/v2/delete/{method}` - Delete data from device

### Health Check
- `GET /health` - Service health status

## Data Types Supported

The wearables service supports various health data types:

- `steps` - Step count data
- `heartRate` - Heart rate measurements
- `activeCaloriesBurned` - Active calories burned
- `sleepSession` - Sleep tracking data
- `distance` - Distance traveled
- `bloodPressure` - Blood pressure readings
- `oxygenSaturation` - Blood oxygen levels
- `weight` - Weight measurements
- `exerciseSession` - Exercise session data

## Frontend Integration

The frontend includes a comprehensive Wearables component (`/src/components/Wearables.tsx`) that:

- Displays connected devices
- Shows health metrics and trends
- Provides data visualization with charts
- Supports device connection simulation
- Implements authentication with the wearables service

## Security Features

- **Data Encryption**: All health data is encrypted using Fernet encryption
- **Token-based Authentication**: JWT tokens with expiration
- **MongoDB User Isolation**: Each user has a separate database
- **Health Check Endpoints**: Container health monitoring

## Deployment

### Local Development

1. Ensure all environment variables are set
2. Run the services:
   ```bash
   cd backend
   docker-compose up -d
   ```

3. The services will be available at:
   - Main API: http://localhost:3000
   - Wearables API: http://localhost:6644
   - Frontend: http://localhost:5174

### Production Deployment

For production, the wearables service should be deployed as part of the Cloud-Care infrastructure. The frontend will route wearables requests through the main backend API which proxies to the wearables service.

## Firebase Configuration (Optional)

For push notifications and device communication, configure Firebase:

1. Create a Firebase project
2. Generate a service account key
3. Replace `backend/wearables/service-account.json` with your key
4. Set `FCM_PROJECT_ID` in the wearables `.env` file

## Troubleshooting

### Common Issues

1. **Wearables service won't start**: Check MongoDB connection and service-account.json file
2. **Frontend can't connect**: Verify VITE_WEARABLES_SERVICE_URL is correctly set
3. **Authentication fails**: Check if MongoDB is running and accessible
4. **Health check fails**: Ensure all Python dependencies are installed

### Monitoring

Check service health:
```bash
curl http://localhost:6644/health
```

Check MongoDB connection:
```bash
docker exec cloudcare-wearables-db mongosh --eval "db.adminCommand('ping')"
```

## Development Notes

- The wearables service runs independently of the main Cloud-Care backend
- Data is encrypted per-user using their password hash as the encryption key
- The service supports both individual time points and time ranges for health data
- Frontend components gracefully handle service unavailability
