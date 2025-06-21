# Disaster Response Frontend

A modern React TypeScript frontend for the Disaster Response Coordination Platform, featuring real-time updates, interactive maps, and a responsive design optimized for emergency response scenarios.

## 🌟 Live Demo

**Frontend**: [https://disaster-response-dusky.vercel.app/](https://disaster-response-dusky.vercel.app/)

## 🚀 Features

### Core Features
- **Modern UI/UX**: Built with Tailwind CSS, Framer Motion, and Lucide React icons
- **Real-time Updates**: Socket.IO integration for live updates
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Type Safety**: Full TypeScript implementation
- **State Management**: React Query for server state management
- **Form Handling**: React Hook Form for efficient form management
- **Routing**: React Router for navigation
- **Animations**: Smooth animations and transitions with Framer Motion

### Advanced Features
- **Interactive Maps**: OpenStreetMap integration with Leaflet
- **Real-time Notifications**: Toast notifications for updates
- **File Upload**: Drag-and-drop file upload with preview
- **Search & Filtering**: Advanced search and filter capabilities
- **Data Visualization**: Charts and statistics with Recharts
- **Offline Support**: Progressive Web App capabilities
- **Accessibility**: WCAG compliant design

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Query** - Server state management
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Lucide React** - Icon library
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **Date-fns** - Date utilities
- **React Leaflet** - Map integration
- **React Dropzone** - File upload
- **React Hot Toast** - Notifications
- **Recharts** - Data visualization

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components
│   │   └── Layout.tsx  # Main layout with sidebar
│   ├── Maps/           # Map components
│   │   ├── OpenStreetMap.tsx
│   │   └── UnifiedMap.tsx
│   ├── Modals/         # Modal components
│   │   └── CreateDisasterModal.tsx
│   └── RealTimeData/   # Real-time components
│       └── RealTimeData.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Disasters.tsx   # Disasters list
│   ├── DisasterDetail.tsx # Disaster details
│   ├── Reports.tsx     # Reports page
│   ├── Resources.tsx   # Resources page
│   ├── SocialMedia.tsx # Social media page
│   └── Login.tsx       # Login page
├── services/           # API and service layer
│   ├── api.ts         # API service
│   └── socket.ts      # Socket.IO service
├── types/              # TypeScript type definitions
│   └── index.ts       # Main types
├── App.tsx            # Main app component
├── index.tsx          # App entry point
└── index.css          # Global styles
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend server running (see backend README)

### Option 1: Docker Deployment (Recommended)

1. **Clone the Repository**
```bash
git clone https://github.com/Hmtgit7/Disaster-Response.git
cd Disaster-Response/frontend
```

2. **Build and Run with Docker**
```bash
# Build the image
docker build -t disaster-response-frontend .

# Run the container
docker run -p 3000:80 disaster-response-frontend
```

3. **Access the Application**
- Frontend: http://localhost:3000

### Option 2: Local Development

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
```

3. **Configure Environment Variables**
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000/api

# WebSocket URL
REACT_APP_WS_URL=http://localhost:5000

# Map Configuration
REACT_APP_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# Feature Flags
REACT_APP_ENABLE_SOCKET=true
REACT_APP_ENABLE_MAPS=true
```

4. **Start Development Server**
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## 🗺️ Map Integration

### OpenStreetMap Features
- **Interactive Maps**: Full-screen map views
- **Custom Markers**: Different icons for disasters and resources
- **Geolocation**: User location detection
- **Search**: Address search and geocoding
- **Clustering**: Marker clustering for better performance
- **Layers**: Multiple map layers and overlays

### Map Components
- **UnifiedMap**: Main map component with all features
- **OpenStreetMap**: Native OpenStreetMap implementation
- **Map Controls**: Zoom, pan, and layer controls
- **Marker Management**: Dynamic marker creation and updates

## 🔌 API Integration

### REST API Communication
The frontend communicates with the backend through:

- **Axios**: HTTP client with interceptors
- **React Query**: Data fetching and caching
- **Error Handling**: Comprehensive error management
- **Loading States**: Loading indicators and skeletons

### Real-time Communication
- **Socket.IO**: Real-time updates and notifications
- **Event Handling**: Disaster updates, new reports, resource changes
- **Connection Management**: Automatic reconnection
- **Room Management**: Join/leave disaster-specific rooms

## 🎨 Styling & Design

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        success: {
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        }
      }
    }
  },
  plugins: []
}
```

### Custom Components
- **Button Components**: Primary, secondary, danger variants
- **Card Components**: Information cards with headers
- **Form Components**: Input fields, selects, textareas
- **Modal Components**: Overlay dialogs
- **Badge Components**: Status indicators
- **Loading Components**: Spinners and skeletons

### Responsive Design
- **Mobile First**: Designed for mobile devices first
- **Breakpoints**: Tailwind's responsive breakpoints
- **Touch Friendly**: Large touch targets
- **Adaptive Layout**: Flexible grid systems

## 🔧 Development

### Available Scripts

```bash
# Development
npm start          # Start development server
npm run build      # Build for production
npm run test       # Run tests
npm run eject      # Eject from Create React App

# Docker
docker build .     # Build Docker image
docker run -p 3000:80 disaster-response-frontend  # Run container
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Component Architecture**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode
npm run test -- --watch
```

## 🐳 Docker Deployment

### Production Build
```bash
# Build the production image
docker build -t disaster-response-frontend .

# Run with environment variables
docker run -p 3000:80 \
  -e REACT_APP_API_URL=https://api.example.com \
  -e REACT_APP_WS_URL=https://api.example.com \
  disaster-response-frontend
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://backend:5000/api
      - REACT_APP_WS_URL=http://backend:5000
    depends_on:
      - backend
```

### Nginx Configuration
The Docker image includes a custom Nginx configuration for:
- **Static File Serving**: Optimized for React apps
- **Routing**: Client-side routing support
- **Caching**: Browser caching for static assets
- **Compression**: Gzip compression
- **Security Headers**: Security best practices

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy as a React application

### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy the build folder to your web server
# The build folder contains all static files
```

## 📱 Progressive Web App

### PWA Features
- **Offline Support**: Service worker for offline functionality
- **App Installation**: Install as native app
- **Push Notifications**: Real-time notifications
- **Background Sync**: Sync data when online

### Service Worker
```javascript
// public/sw.js
const CACHE_NAME = 'disaster-response-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

## 🔒 Security

### Security Headers
- **Content Security Policy**: Restrict resource loading
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **Referrer Policy**: Control referrer information

### Input Validation
- **Form Validation**: Client-side validation
- **XSS Prevention**: Sanitize user inputs
- **CSRF Protection**: Token-based protection

## 📊 Performance

### Optimization Techniques
- **Code Splitting**: Lazy loading of components
- **Bundle Analysis**: Webpack bundle analyzer
- **Image Optimization**: Compressed images
- **Caching**: Browser and CDN caching
- **Minification**: Minified CSS and JS

### Performance Monitoring
- **Web Vitals**: Core Web Vitals tracking
- **Bundle Size**: Monitor bundle size
- **Loading Times**: Track page load times
- **User Experience**: Monitor user interactions

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end testing with Cypress
- **Visual Tests**: Visual regression testing

### Test Examples
```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

test('renders dashboard title', () => {
  render(<Dashboard />);
  const titleElement = screen.getByText(/Disaster Response/i);
  expect(titleElement).toBeInTheDocument();
});
```

## 🤝 Contributing

### Development Guidelines
1. **Follow TypeScript best practices**
2. **Add tests for new features**
3. **Update documentation**
4. **Follow the existing code style**
5. **Ensure mobile responsiveness**
6. **Test accessibility features**

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 📝 License

This project is part of the Disaster Response Coordination Platform.

## 🆘 Support

For support and questions:
- Create an issue in the [GitHub repository](https://github.com/Hmtgit7/Disaster-Response)
- Check the documentation
- Review the component examples

## 🎉 Acknowledgments

- [React](https://reactjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [OpenStreetMap](https://www.openstreetmap.org/) for free mapping
- [Framer Motion](https://www.framer.com/motion/) for animations
- The open-source community for amazing tools and libraries

---

**Built with ❤️ for emergency response coordination**
