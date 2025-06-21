import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Disaster, 
  Report, 
  Resource, 
  SocialMediaPost, 
  OfficialUpdate, 
  GeocodingResult, 
  ImageVerificationResult,
  CreateDisasterForm,
  CreateReportForm,
  CreateResourceForm,
  ApiResponse,
  PaginatedResponse,
  DisasterFilters,
  ResourceFilters,
  ReportFilters
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add user ID header
      const userId = localStorage.getItem('user_id') || 'anonymous';
      config.headers['x-user-id'] = userId;
      
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Disaster APIs
  async getDisasters(filters?: DisasterFilters, page = 1, limit = 10): Promise<PaginatedResponse<Disaster>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.owner_id) params.append('owner_id', filters.owner_id);
    if (filters?.lat) params.append('lat', filters.lat.toString());
    if (filters?.lng) params.append('lng', filters.lng.toString());
    if (filters?.radius) params.append('radius', filters.radius.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response: AxiosResponse<PaginatedResponse<Disaster>> = await this.api.get(`/disasters?${params}`);
    return response.data;
  }

  async getDisaster(id: string): Promise<ApiResponse<Disaster>> {
    const response: AxiosResponse<ApiResponse<Disaster>> = await this.api.get(`/disasters/${id}`);
    return response.data;
  }

  async createDisaster(data: CreateDisasterForm): Promise<ApiResponse<Disaster>> {
    const response: AxiosResponse<ApiResponse<Disaster>> = await this.api.post('/disasters', data);
    return response.data;
  }

  async updateDisaster(id: string, data: Partial<CreateDisasterForm>): Promise<ApiResponse<Disaster>> {
    const response: AxiosResponse<ApiResponse<Disaster>> = await this.api.put(`/disasters/${id}`, data);
    return response.data;
  }

  async deleteDisaster(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/disasters/${id}`);
    return response.data;
  }

  async getDisasterStatistics(id: string): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/disasters/${id}/statistics`);
    return response.data;
  }

  // Report APIs
  async getReports(filters?: ReportFilters, page = 1, limit = 20): Promise<PaginatedResponse<Report>> {
    const params = new URLSearchParams();
    if (filters?.disaster_id) params.append('disaster_id', filters.disaster_id);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.verification_status) params.append('verification_status', filters.verification_status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response: AxiosResponse<PaginatedResponse<Report>> = await this.api.get(`/reports?${params}`);
    return response.data;
  }

  async getReport(id: string): Promise<ApiResponse<Report>> {
    const response: AxiosResponse<ApiResponse<Report>> = await this.api.get(`/reports/${id}`);
    return response.data;
  }

  async createReport(data: CreateReportForm): Promise<ApiResponse<Report>> {
    const response: AxiosResponse<ApiResponse<Report>> = await this.api.post('/reports', data);
    return response.data;
  }

  async updateReportVerification(id: string, verification_status: string, image_url?: string): Promise<ApiResponse<Report>> {
    const response: AxiosResponse<ApiResponse<Report>> = await this.api.put(`/reports/${id}/verify`, {
      verification_status,
      image_url
    });
    return response.data;
  }

  async deleteReport(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/reports/${id}`);
    return response.data;
  }

  // Resource APIs
  async getResources(filters?: ResourceFilters, page = 1, limit = 20): Promise<PaginatedResponse<Resource>> {
    const params = new URLSearchParams();
    if (filters?.disaster_id) params.append('disaster_id', filters.disaster_id);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.available !== undefined) params.append('available', filters.available.toString());
    if (filters?.lat) params.append('lat', filters.lat.toString());
    if (filters?.lng) params.append('lng', filters.lng.toString());
    if (filters?.radius) params.append('radius', filters.radius.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response: AxiosResponse<PaginatedResponse<Resource>> = await this.api.get(`/resources?${params}`);
    return response.data;
  }

  async getNearbyResources(lat: number, lng: number, radius = 10000, type?: string, disaster_id?: string): Promise<ApiResponse<Resource[]>> {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
    params.append('radius', radius.toString());
    if (type) params.append('type', type);
    if (disaster_id) params.append('disaster_id', disaster_id);

    const response: AxiosResponse<ApiResponse<Resource[]>> = await this.api.get(`/resources/nearby?${params}`);
    return response.data;
  }

  async getResource(id: string): Promise<ApiResponse<Resource>> {
    const response: AxiosResponse<ApiResponse<Resource>> = await this.api.get(`/resources/${id}`);
    return response.data;
  }

  async createResource(data: CreateResourceForm): Promise<ApiResponse<Resource>> {
    const response: AxiosResponse<ApiResponse<Resource>> = await this.api.post('/resources', data);
    return response.data;
  }

  async updateResource(id: string, data: Partial<CreateResourceForm>): Promise<ApiResponse<Resource>> {
    const response: AxiosResponse<ApiResponse<Resource>> = await this.api.put(`/resources/${id}`, data);
    return response.data;
  }

  async deleteResource(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/resources/${id}`);
    return response.data;
  }

  // Social Media APIs
  async getSocialMediaPosts(disaster_id: string, platform = 'twitter', limit = 20): Promise<ApiResponse<SocialMediaPost[]>> {
    const params = new URLSearchParams();
    params.append('disaster_id', disaster_id);
    params.append('platform', platform);
    params.append('limit', limit.toString());

    const response: AxiosResponse<ApiResponse<SocialMediaPost[]>> = await this.api.get(`/social-media?${params}`);
    return response.data;
  }

  async getUrgentSocialMediaPosts(disaster_id: string, platform = 'twitter'): Promise<ApiResponse<SocialMediaPost[]>> {
    const params = new URLSearchParams();
    params.append('disaster_id', disaster_id);
    params.append('platform', platform);

    const response: AxiosResponse<ApiResponse<SocialMediaPost[]>> = await this.api.get(`/social-media/urgent?${params}`);
    return response.data;
  }

  // Official Updates APIs
  async getOfficialUpdates(disaster_id: string): Promise<ApiResponse<OfficialUpdate[]>> {
    const response: AxiosResponse<ApiResponse<OfficialUpdate[]>> = await this.api.get(`/official-updates?disaster_id=${disaster_id}`);
    return response.data;
  }

  // Geocoding APIs
  async geocodeLocation(location_name: string): Promise<ApiResponse<GeocodingResult>> {
    const response: AxiosResponse<ApiResponse<GeocodingResult>> = await this.api.post('/geocode', { location_name });
    return response.data;
  }

  // Image Verification APIs
  async verifyImage(image_url: string, disaster_context?: string): Promise<ApiResponse<ImageVerificationResult>> {
    const response: AxiosResponse<ApiResponse<ImageVerificationResult>> = await this.api.post('/verify/image', {
      image_url,
      disaster_context
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/health');
    return response.data;
  }

  // Real-time APIs
  async getRealTimeData(disaster_id?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (disaster_id) params.append('disaster_id', disaster_id);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/realtime?${params}`);
    return response.data;
  }

  async getRealTimeDisasters(disaster_id?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (disaster_id) params.append('disaster_id', disaster_id);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/realtime/disasters?${params}`);
    return response.data;
  }

  async getRealTimeSocialMedia(disaster_id?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (disaster_id) params.append('disaster_id', disaster_id);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/realtime/social-media?${params}`);
    return response.data;
  }

  async getRealTimeWeather(disaster_id?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (disaster_id) params.append('disaster_id', disaster_id);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/realtime/weather?${params}`);
    return response.data;
  }

  async getRealTimeEmergencyAlerts(disaster_id?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (disaster_id) params.append('disaster_id', disaster_id);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/realtime/emergency-alerts?${params}`);
    return response.data;
  }

  async getRealTimeResources(disaster_id?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (disaster_id) params.append('disaster_id', disaster_id);

    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(`/realtime/resources?${params}`);
    return response.data;
  }

  async getRealTimeStatus(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/realtime/status');
    return response.data;
  }

  // Social Media API calls
  static async getSocialMediaPosts(disasterId?: string, platform: string = '', limit?: number): Promise<SocialMediaPost[]> {
    try {
      const params = new URLSearchParams();
      if (disasterId) params.append('disaster_id', disasterId);
      if (platform) params.append('platform', platform);
      if (limit) params.append('limit', limit.toString());
      const response = await fetch(`${API_BASE_URL}/social-media/search?${params}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch social media posts');
      return data.data;
    } catch (error) {
      console.error('Error fetching social media posts:', error);
      return [];
    }
  }

  static async getOfficialUpdates(userHandles: string[] = [], limit?: number): Promise<SocialMediaPost[]> {
    try {
      const params = new URLSearchParams();
      if (userHandles && userHandles.length > 0) {
        params.append('userHandles', userHandles.join(','));
      }
      if (limit) params.append('limit', limit.toString());
      const response = await fetch(`${API_BASE_URL}/social-media/official?${params}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch official updates');
      return data.data;
    } catch (error) {
      console.error('Error fetching official updates:', error);
      return [];
    }
  }

  static async getTrendingTopics(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/social-media/trending`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch trending topics');
      return data.data;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  static async postMessage(text: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/social-media/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to post message');
      return true;
    } catch (error) {
      console.error('Error posting message:', error);
      return false;
    }
  }
}

export const apiService = new ApiService(); 