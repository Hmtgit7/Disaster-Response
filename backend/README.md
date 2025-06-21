# Disaster Response Backend API

A robust Node.js/TypeScript backend API for the Disaster Response Coordination Platform, featuring real-time data processing, AI-powered verification, and comprehensive disaster management capabilities.

## 🚀 Features

### Core API Features
- **RESTful API** with Express.js and TypeScript
- **Real-time Communication** with Socket.IO
- **AI Integration** with Google Gemini API
- **Geospatial Queries** with Supabase PostgreSQL
- **Social Media Integration** with Twitter API
- **Image Verification** using AI
- **Caching System** with Redis
- **Comprehensive Logging** with Winston

### Advanced Features
- **Rate Limiting** and request throttling
- **Input Validation** with express-validator
- **Security Headers** with Helmet.js
- **CORS Configuration** for cross-origin requests
- **Health Check Endpoints** for monitoring
- **Audit Trails** for all operations
- **Error Handling** with structured logging

## 🛠️ Tech Stack

- **Node.js** (v18+) with Express.js
- **TypeScript** for type safety
- **Supabase** for PostgreSQL database
- **Socket.IO** for real-time communication
- **Google Gemini API** for AI features
- **Twitter API** for social media monitoring
- **Redis** for caching and session storage
- **Winston** for structured logging
- **Jest** for testing
- **Docker** for containerization

## 📁 Project Structure

```
src/
├── config/
│   └── database.ts          # Database configuration
├── routes/
│   ├── auth.ts             # Authentication routes
│   ├── disasters.ts        # Disaster management
│   ├── reports.ts          # Report management
│   ├── resources.ts        # Resource management
│   ├── socialMedia.ts      # Social media integration
│   ├── geocoding.ts        # Geocoding services
│   ├── verification.ts     # AI verification
│   ├── officialUpdates.ts  # Official updates
│   └── realtime.ts         # Real-time data
├── services/
│   ├── geminiService.ts    # Google Gemini AI
│   ├── geocodingService.ts # Geocoding with OpenStreetMap
│   ├── cacheService.ts     # Redis caching
│   ├── realTimeDataService.ts # Real-time data polling
│   ├── blueskyService.ts   # Bluesky social media
│   └── mockDataService.ts  # Mock data for development
├── types/
│   └── index.ts           # TypeScript type definitions
├── utils/
│   └── logger.ts          # Winston logger configuration
└── index.ts               # Main application entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key
- Redis (optional, for caching)

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
cp env.example .env
```

3. **Configure Environment Variables**
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External APIs (Optional)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Cache Configuration
CACHE_TTL_HOURS=1
```

4. **Development Mode**
```bash
npm run dev
```

5. **Production Build**
```bash
npm run build
npm start
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Service health status

### Disasters
- `POST /api/disasters` - Create new disaster
- `GET /api/disasters` - List disasters with filters
- `GET /api/disasters/:id` - Get disaster details
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster

### Resources
- `GET /api/resources` - List resources with geospatial queries
- `POST /api/resources` - Create new resource
- `GET /api/resources/:id` - Get resource details
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Reports
- `GET /api/reports` - List reports with filters
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Geocoding
- `POST /api/geocode` - Convert location name to coordinates
- `GET /api/geocode/reverse` - Reverse geocoding

### Social Media
- `GET /api/social-media/:disasterId` - Get social media posts
- `POST /api/social-media/monitor` - Start monitoring

### Verification
- `POST /api/verify/image` - Verify image authenticity
- `POST /api/verify/text` - Verify text content

### Real-time Data
- `GET /api/realtime/weather` - Get weather alerts
- `GET /api/realtime/emergency` - Get emergency alerts
- `GET /api/realtime/status` - Get real-time status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

## 🗄️ Database Schema

### Disasters Table
```sql
CREATE TABLE disasters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location_name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audit_trail JSONB DEFAULT '[]'
);
```

### Resources Table
```sql
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  type TEXT NOT NULL CHECK (type IN ('shelter', 'hospital', 'food', 'water', 'medical', 'transport')),
  capacity INTEGER,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Reports Table
```sql
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Services

### Gemini Service
AI-powered features using Google Gemini API:
- Location extraction from text
- Image verification
- Content analysis
- Natural language processing

### Geocoding Service
Location services using OpenStreetMap Nominatim:
- Forward geocoding (address to coordinates)
- Reverse geocoding (coordinates to address)
- Caching for improved performance
- Rate limiting compliance

### Real-time Data Service
Continuous data polling and updates:
- Weather alerts from National Weather Service
- Emergency alerts from FEMA
- Resource availability updates
- Social media monitoring

### Cache Service
Redis-based caching system:
- API response caching
- Session storage
- Rate limiting data
- Temporary data storage

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t disaster-response-backend .
```

### Run Container
```bash
docker run -p 5000:5000 --env-file .env disaster-response-backend
```

### Docker Compose
```bash
docker-compose up backend
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

### Logs
```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

### Metrics
- Request/response times
- Error rates
- API usage statistics
- Database performance
- Cache hit rates

## 🔒 Security

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable limits
- Automatic blocking of abusive IPs

### Input Validation
- Request body validation
- Query parameter validation
- File upload validation
- SQL injection prevention

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy
- XSS protection

## 🚀 Performance

### Caching Strategy
- Redis for session storage
- API response caching
- Database query caching
- Static asset caching

### Database Optimization
- Geospatial indexes
- Query optimization
- Connection pooling
- Prepared statements

### Load Balancing
- Horizontal scaling support
- Health check endpoints
- Graceful shutdown
- Process management

## 🔧 Configuration

### Environment Variables
All configuration is done through environment variables:

- **Server**: PORT, NODE_ENV, FRONTEND_URL
- **Database**: SUPABASE_URL, SUPABASE_ANON_KEY
- **AI**: GEMINI_API_KEY
- **Security**: JWT_SECRET
- **Rate Limiting**: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
- **External APIs**: TWITTER_*, WEATHER_*, FEMA_*

### Logging Configuration
- Winston logger with multiple transports
- Structured logging with metadata
- Log rotation and archiving
- Error tracking and alerting

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation
4. Follow the existing code style
5. Ensure proper error handling

## 📝 License

This project is part of the Disaster Response Coordination Platform.

---

**Built with ❤️ for emergency response coordination** 