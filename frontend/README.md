# Disaster Response Frontend

A modern React TypeScript frontend for the Disaster Response Coordination Platform.

## Features

- **Modern UI/UX**: Built with Tailwind CSS, Framer Motion, and Lucide React icons
- **Real-time Updates**: Socket.IO integration for live updates
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Type Safety**: Full TypeScript implementation
- **State Management**: React Query for server state management
- **Form Handling**: React Hook Form for efficient form management
- **Routing**: React Router for navigation
- **Animations**: Smooth animations and transitions with Framer Motion

## Tech Stack

- **React 19** - UI library
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

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment variables:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components
│   └── Modals/         # Modal components
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

## Key Components

### Layout
- **Layout.tsx**: Main layout with sidebar navigation
- Responsive design with mobile menu
- User authentication status display

### Pages
- **Dashboard**: Overview with statistics and recent activity
- **Disasters**: List and manage disaster events
- **DisasterDetail**: Detailed view with tabs for reports, resources, and social media
- **Reports**: View and manage disaster reports
- **Resources**: Manage disaster response resources
- **SocialMedia**: Monitor social media posts

### Services
- **api.ts**: Centralized API service with interceptors
- **socket.ts**: Real-time communication service

## Features

### Dashboard
- Real-time statistics
- Recent disasters, reports, and resources
- Urgent alerts section
- Quick action buttons

### Disaster Management
- Create, view, edit, and delete disasters
- Advanced filtering and search
- Tag-based categorization
- Location extraction from descriptions

### Real-time Updates
- Socket.IO integration for live updates
- Automatic data refresh
- Real-time notifications

### Responsive Design
- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interactions
- Adaptive navigation

## Styling

The application uses Tailwind CSS with custom components:

### Custom Classes
- `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- `.card`, `.card-header`, `.card-body`
- `.badge`, `.badge-primary`, `.badge-danger`, etc.
- `.input` for form inputs
- `.status-indicator` for status indicators

### Color Scheme
- **Primary**: Blue shades for main actions
- **Success**: Green for positive states
- **Warning**: Yellow/Orange for warnings
- **Danger**: Red for errors and urgent items

## API Integration

The frontend communicates with the backend through:

- **REST API**: CRUD operations for all entities
- **Socket.IO**: Real-time updates and notifications
- **Authentication**: JWT-based authentication (mock for demo)

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service

3. Configure environment variables for production

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Include proper error handling
4. Test on mobile devices
5. Update documentation

## License

This project is part of the Disaster Response Coordination Platform assignment.
