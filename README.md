# Disaster Response Coordination Platform

A comprehensive MERN stack application for disaster response coordination, featuring real-time data aggregation, geospatial mapping, and AI-powered verification. This platform helps emergency responders, government agencies, and volunteers coordinate disaster response efforts efficiently.

## 🌟 Live Demo

**Frontend**: [https://disaster-response-dusky.vercel.app/](https://disaster-response-dusky.vercel.app/)  
**Backend API**: [https://disaster-response-backend.onrender.com](https://disaster-response-backend.onrender.com)

## 🚀 Features

### Core Functionality
- **Disaster Data Management**: CRUD operations for disaster records with audit trails
- **Location Extraction & Geocoding**: AI-powered location extraction using Google Gemini API
- **Real-time Social Media Monitoring**: Twitter API integration for disaster-related posts
- **Geospatial Resource Mapping**: OpenStreetMap integration with Supabase geospatial queries
- **Official Updates Aggregation**: Web scraping for government and relief updates
- **Image Verification**: Google Gemini API for image authenticity analysis
- **Real-time Updates**: WebSocket integration for live data updates

### Advanced Features
- **Real-time Weather Alerts**: National Weather Service integration
- **Emergency Alerts**: FEMA API integration for official emergency notifications
- **Resource Management**: Track and manage disaster response resources
- **Report Verification**: AI-powered verification of user-submitted reports
- **Audit Trails**: Complete tracking of all data modifications
- **Geospatial Queries**: Find nearby resources and disasters
- **Caching System**: Redis-based caching for improved performance

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Supabase** for PostgreSQL database and geospatial queries
- **Socket.IO** for real-time communication
- **Google Gemini API** for AI features
- **Twitter API** for social media monitoring
- **OpenStreetMap Nominatim** for geocoding (free, no API key required)
- **Redis** for caching and session storage
- **Winston** for structured logging
- **Jest** for testing

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **React Leaflet** for OpenStreetMap integration
- **Socket.IO Client** for real-time updates
- **React Query** for data fetching
- **React Hook Form** for form handling
- **Framer Motion** for animations
- **Lucide React** for icons

### DevOps & Deployment
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Nginx** for frontend serving
- **Vercel** for frontend deployment
- **Render** for backend deployment

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)
- Supabase account (free tier available)
- Google Gemini API key
- Twitter API credentials (optional)

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

1. **Clone the Repository**
```bash
git clone https://github.com/Hmtgit7/Disaster-Response.git
cd Disaster-Response
```

2. **Set up Environment Variables**
```bash
# Copy environment template
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the environment files with your API keys
```

3. **Start with Docker Compose**
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

### Option 2: Local Development

#### 1. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
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

#### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000/api

# WebSocket URL
REACT_APP_WS_URL=http://localhost:5000
```

#### 3. Run the Application
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm start
```

## 🔑 API Keys Setup

### Google Gemini (Required)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your environment variables

### Twitter API (Optional)
1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new app
3. Get your API keys and tokens

### Supabase (Required)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the URL and anon key

## 🗄️ Database Setup

The application will automatically create tables and sample data when you first run it. However, you can also run the SQL manually in your Supabase SQL editor:

```sql
-- Create disasters table
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

-- Create resources table
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

-- Create reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cache table
CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create geospatial indexes
CREATE INDEX disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX resources_location_idx ON resources USING GIST (location);
CREATE INDEX disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX cache_expires_idx ON cache (expires_at);
```

## 🗺️ Map Integration

The application uses **OpenStreetMap** as the mapping service with the following features:

### Map Components
- **UnifiedMap**: Uses OpenStreetMap (free, no API key required)
- **OpenStreetMap**: Native OpenStreetMap implementation with Leaflet

### Map Features
- Interactive disaster location markers
- Resource location mapping
- Real-time location updates
- Geospatial queries for nearby resources
- Custom marker icons for different resource types
- Free and open-source mapping tiles

### Geocoding
The backend geocoding service uses OpenStreetMap Nominatim:
- **OpenStreetMap Nominatim** (free, no API key required)
- Automatic caching for improved performance
- Rate limiting compliance

## 🔌 API Endpoints

### Disasters
- `POST /api/disasters` - Create disaster
- `GET /api/disasters` - List disasters with filters
- `GET /api/disasters/:id` - Get disaster details
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster

### Resources
- `GET /api/resources` - List resources with geospatial queries
- `POST /api/resources` - Create resource
- `GET /api/resources/:id` - Get resource details

### Geocoding
- `POST /api/geocode` - Convert location name to coordinates

### Social Media
- `GET /api/social-media/:disasterId` - Get Twitter posts

### Verification
- `POST /api/verify/image` - Verify image authenticity

### Real-time
- `GET /api/realtime/weather` - Get weather alerts
- `GET /api/realtime/emergency` - Get emergency alerts

## 🐳 Docker Commands

### Development
```bash
# Build and start services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild specific service
docker-compose build backend
```

### Production
```bash
# Build for production
docker-compose -f docker-compose.yml up --build -d

# Scale services
docker-compose up -d --scale backend=3

# Update services
docker-compose pull && docker-compose up -d
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy as a React application

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Node.js service

### Docker Deployment
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Deploy to your server
docker-compose -f docker-compose.yml up -d
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests with Docker
docker-compose exec backend npm test
```

## 📊 Monitoring & Logging

- Structured logging with Winston
- Request/response logging
- Error tracking and monitoring
- Performance metrics
- Audit trails for all operations
- Health check endpoints

## 🔒 Security Features

- Input validation and sanitization
- Rate limiting and request throttling
- CORS configuration
- Helmet.js security headers
- JWT-based authentication (mock implementation)
- Non-root Docker containers
- Security headers in Nginx

## 🎯 Usage Examples

### Creating a Disaster
```javascript
const disaster = {
  title: "NYC Flood Emergency",
  location_name: "Manhattan, NYC",
  description: "Heavy flooding affecting Lower East Side",
  tags: ["flood", "urgent", "manhattan"]
};

const response = await fetch('/api/disasters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(disaster)
});
```

### Geospatial Resource Query
```javascript
const resources = await fetch('/api/resources?lat=40.7128&lng=-74.0060&radius=10000');
```

## 🚨 Error Handling

The application includes comprehensive error handling:
- Rate limiting for API protection
- Fallback mechanisms for external services
- Structured error logging
- User-friendly error messages
- Graceful degradation when services are unavailable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Follow the existing code style
- Ensure mobile responsiveness

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the [GitHub repository](https://github.com/Hmtgit7/Disaster-Response)
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs`

## 🎉 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for providing free mapping services
- [Google Gemini](https://aistudio.google.com/) for AI-powered features
- [Supabase](https://supabase.com/) for the database and geospatial capabilities
- [Twitter](https://developer.twitter.com/) for social media integration
- [National Weather Service](https://www.weather.gov/) for weather alerts
- [FEMA](https://www.fema.gov/) for emergency alerts
- The open-source community for the amazing tools and libraries

## 📈 Roadmap

- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with more emergency services
- [ ] Real-time video streaming
- [ ] Advanced geospatial features
- [ ] Machine learning for disaster prediction

---

**Built with ❤️ for emergency response coordination** 