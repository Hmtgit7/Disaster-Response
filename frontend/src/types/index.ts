// Backend API Types
export interface Disaster {
  id: string;
  title: string;
  location_name: string;
  location: {
    lat: number;
    lng: number;
  };
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
  updated_at: string;
  audit_trail: AuditTrail[];
}

export interface Report {
  id: string;
  disaster_id: string;
  user_id: string;
  content: string;
  image_url?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export interface Resource {
  id: string;
  disaster_id: string;
  name: string;
  location_name: string;
  location: {
    lat: number;
    lng: number;
  };
  type: 'shelter' | 'hospital' | 'food' | 'water' | 'medical' | 'transport';
  capacity?: number;
  available?: boolean;
  created_at: string;
}

export interface SocialMediaPost {
  id: string;
  platform: 'bluesky' | 'twitter';
  user: string;
  content: string;
  timestamp: string;
  disaster_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  engagement?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

export interface OfficialUpdate {
  id: string;
  source: string;
  title: string;
  content: string;
  url: string;
  timestamp: string;
  disaster_id?: string;
}

export interface GeocodingResult {
  location_name: string;
  lat: number;
  lng: number;
  formatted_address: string;
}

export interface ImageVerificationResult {
  is_authentic: boolean;
  confidence: number;
  analysis: string;
  detected_manipulations?: string[];
}

export interface AuditTrail {
  action: string;
  user_id: string;
  timestamp: string;
  details?: any;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'contributor' | 'viewer';
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface CreateDisasterForm {
  title: string;
  location_name: string;
  description: string;
  tags: string[];
}

export interface CreateReportForm {
  disaster_id: string;
  content: string;
  image_url?: string;
}

export interface CreateResourceForm {
  disaster_id: string;
  name: string;
  location_name: string;
  type: 'shelter' | 'hospital' | 'food' | 'water' | 'medical' | 'transport';
  capacity?: number;
  available?: boolean;
}

// UI Types
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'disaster' | 'resource' | 'report';
  data: any;
}

// Socket Events
export interface SocketEvents {
  disaster_updated: (disaster: Disaster) => void;
  social_media_updated: (posts: SocialMediaPost[]) => void;
  resources_updated: (resources: Resource[]) => void;
  report_verified: (report: Report) => void;
}

// Filter Types
export interface DisasterFilters {
  search?: string;
  tag?: string;
  owner_id?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface ResourceFilters {
  disaster_id?: string;
  type?: string;
  available?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface ReportFilters {
  disaster_id?: string;
  user_id?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
} 