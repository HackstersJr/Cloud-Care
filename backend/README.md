# CloudCare Healthcare Backend

A secure, scalable backend for managing healthcare records with ABHA health ID integration, medical record storage, family linking, and QR-based data sharing. Fully compliant with HIPAA and other healthcare data privacy regulations.

## 🏥 Features

- **Patient Management**: Comprehensive patient profiles with medical history
- **Doctor Portal**: Doctor verification, appointment management, and patient care
- **Medical Records**: Secure storage with blockchain integration for critical data
- **ABHA Integration**: Ayushman Bharat Health Account integration for Indian healthcare
- **Family Linking**: Secure family account connections with permission-based access
- **QR Code Sharing**: Temporary medical record sharing via secure QR codes
- **HIPAA Compliance**: Full audit logging and PHI encryption
- **Multi-role Support**: Patients, doctors, nurses, and administrators

## 🚀 Tech Stack

- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with full ACID compliance
- **Blockchain**: Ethereum-compatible networks (via ethers.js)
- **Cloud**: Google Cloud Run/App Engine ready
- **Security**: JWT authentication, bcrypt encryption, rate limiting
- **API**: RESTful with FHIR data model best practices

## 📦 Prerequisites

- Node.js 18.0+ and npm 9.0+
- PostgreSQL 12+
- Docker and Docker Compose (for containerized deployment)
- Google Cloud SDK (for cloud deployment)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd CloudCare
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - Database connection details
# - JWT secret keys
# - ABHA API credentials
# - Blockchain configuration
```

### 3. Database Setup

```bash
# Start PostgreSQL (using Docker)
docker-compose up postgres -d

# Run database migrations
npm run migrate
```

### 4. Development Server

```bash
# Start development server with hot reload
npm run dev

# Or build and start production server
npm run build
npm start
```

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, App)
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Production Docker Build

```bash
# Build production image
docker build -t cloudcare-backend .

# Run with external database
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=your-secret \
  cloudcare-backend
```

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint        # Lint TypeScript code
npm run lint:fix    # Fix linting issues
npm run migrate     # Run database migrations
```

## 📁 Project Structure

```
CloudCare/
├── src/
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models and types
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── server.ts        # Main server file
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── database/
│   └── migrations/     # Database migration scripts
├── logs/               # Application logs
├── docker-compose.yml  # Docker services
├── Dockerfile         # Container definition
└── README.md
```

## 🔐 Security Features

### HIPAA Compliance
- ✅ Audit logging for all PHI access
- ✅ Encryption at rest and in transit
- ✅ Role-based access control
- ✅ Data retention policies
- ✅ Secure authentication

### Data Protection
- ✅ JWT-based authentication
- ✅ bcrypt password hashing
- ✅ Rate limiting and DDoS protection
- ✅ Input validation and sanitization
- ✅ SQL injection prevention

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout

### Patient Endpoints
- `GET /api/v1/patients` - List patients (role-based)
- `GET /api/v1/patients/:id` - Get patient details
- `PUT /api/v1/patients/:id` - Update patient information

### Medical Records
- `GET /api/v1/medical-records` - List medical records
- `POST /api/v1/medical-records` - Create medical record
- `GET /api/v1/medical-records/:id` - Get specific record

### QR Code Sharing
- `POST /api/v1/qr/generate` - Generate QR access token
- `GET /api/v1/qr/access/:token` - Access record via QR

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- health.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## 🌐 Environment Variables

### Required Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudcare_db
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h

# ABHA Integration
ABHA_CLIENT_ID=your_abha_client_id
ABHA_CLIENT_SECRET=your_abha_secret

# Blockchain
BLOCKCHAIN_RPC_URL=https://your-rpc-url
PRIVATE_KEY=your_ethereum_private_key
```

### Optional Variables
```env
# Security
ENCRYPTION_KEY=your-encryption-key
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
```

## 🚀 Deployment

### Google Cloud Run

```bash
# Build and deploy to Cloud Run
gcloud run deploy cloudcare-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Google App Engine

```bash
# Deploy to App Engine
gcloud app deploy
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under a proprietary license. Unauthorized copying, distribution, or modification is prohibited.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release
- Basic CRUD operations for patients, doctors, medical records
- HIPAA-compliant audit logging
- JWT authentication system
- QR code sharing functionality
- Docker containerization
- Comprehensive test suite

---

**⚕️ CloudCare** - Secure Healthcare Data Management Platform
