import { Disaster, Report, Resource, SocialMediaPost } from '../types';

// Mock data for development
const mockDisasters: Disaster[] = [
  {
    id: 'disaster-1',
    title: 'NYC Flood Emergency',
    location_name: 'Manhattan, NYC',
    location: { lat: 40.7128, lng: -74.0060 },
    description: 'Heavy flooding in Manhattan affecting Lower East Side and Financial District',
    tags: ['flood', 'urgent', 'manhattan'],
    owner_id: 'netrunnerX',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    audit_trail: []
  },
  {
    id: 'disaster-2',
    title: 'California Wildfire',
    location_name: 'Los Angeles, CA',
    location: { lat: 34.0522, lng: -118.2437 },
    description: 'Major wildfire spreading rapidly in Los Angeles County',
    tags: ['wildfire', 'california', 'emergency'],
    owner_id: 'reliefAdmin',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    audit_trail: []
  },
  {
    id: 'disaster-3',
    title: 'Texas Tornado',
    location_name: 'Dallas, TX',
    location: { lat: 32.7767, lng: -96.7970 },
    description: 'Tornado touchdown reported in Dallas metropolitan area',
    tags: ['tornado', 'texas', 'dallas'],
    owner_id: 'netrunnerX',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    audit_trail: []
  }
];

const mockReports: Report[] = [
  {
    id: 'report-1',
    disaster_id: 'disaster-1',
    user_id: 'citizen1',
    content: 'URGENT: Water level rising rapidly in Lower East Side. Need immediate evacuation assistance!',
    image_url: 'https://example.com/flood-image-1.jpg',
    verification_status: 'verified',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'report-2',
    disaster_id: 'disaster-1',
    user_id: 'relief_worker',
    content: 'Red Cross shelter now open at 123 Main St. Food and water available.',
    image_url: undefined,
    verification_status: 'verified',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'report-3',
    disaster_id: 'disaster-2',
    user_id: 'firefighter',
    content: 'Fire spreading rapidly towards residential areas. Evacuation orders issued.',
    image_url: 'https://example.com/fire-image-1.jpg',
    verification_status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  }
];

const mockResources: Resource[] = [
  {
    id: 'resource-1',
    disaster_id: 'disaster-1',
    name: 'Red Cross Emergency Shelter',
    location_name: 'Lower East Side, NYC',
    location: { lat: 40.7142, lng: -73.9897 },
    type: 'shelter',
    capacity: 200,
    available: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    id: 'resource-2',
    disaster_id: 'disaster-1',
    name: 'Bellevue Hospital',
    location_name: 'Manhattan, NYC',
    location: { lat: 40.7421, lng: -73.9731 },
    type: 'hospital',
    capacity: 1000,
    available: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'resource-3',
    disaster_id: 'disaster-2',
    name: 'LA County Fire Station',
    location_name: 'Los Angeles, CA',
    location: { lat: 34.0522, lng: -118.2437 },
    type: 'medical',
    capacity: undefined,
    available: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  }
];

const mockSocialMediaPosts: SocialMediaPost[] = [
  {
    id: 'post-1',
    platform: 'twitter',
    user: 'citizen1',
    content: 'URGENT: Need immediate medical assistance in Lower East Side! #floodrelief #SOS',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    disaster_id: 'disaster-1',
    priority: 'urgent'
  },
  {
    id: 'post-2',
    platform: 'twitter',
    user: 'relief_worker',
    content: 'Red Cross shelter now open at 123 Main St. Food and water available. #disasterrelief',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    disaster_id: 'disaster-1',
    priority: 'high'
  },
  {
    id: 'post-3',
    platform: 'twitter',
    user: 'volunteer_org',
    content: 'Volunteers needed for cleanup efforts. Contact us if you can help! #volunteer #disasterresponse',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    disaster_id: 'disaster-1',
    priority: 'medium'
  }
];

export class MockDataService {
  // Disasters
  async getDisasters(page: number = 1, limit: number = 10): Promise<{ data: Disaster[], total: number }> {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = mockDisasters.slice(start, end);
    
    return {
      data: paginatedData,
      total: mockDisasters.length
    };
  }

  async getDisasterById(id: string): Promise<Disaster | null> {
    return mockDisasters.find(d => d.id === id) || null;
  }

  async createDisaster(disaster: Omit<Disaster, 'id' | 'created_at' | 'updated_at'>): Promise<Disaster> {
    const newDisaster: Disaster = {
      ...disaster,
      id: `disaster-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDisasters.push(newDisaster);
    return newDisaster;
  }

  // Reports
  async getReports(page: number = 1, limit: number = 10, disaster_id?: string): Promise<{ data: Report[], total: number }> {
    let filteredReports = mockReports;
    if (disaster_id) {
      filteredReports = mockReports.filter(r => r.disaster_id === disaster_id);
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filteredReports.slice(start, end);
    
    return {
      data: paginatedData,
      total: filteredReports.length
    };
  }

  async createReport(report: Omit<Report, 'id' | 'created_at'>): Promise<Report> {
    const newReport: Report = {
      ...report,
      id: `report-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockReports.push(newReport);
    return newReport;
  }

  // Resources
  async getResources(page: number = 1, limit: number = 10, disaster_id?: string): Promise<{ data: Resource[], total: number }> {
    let filteredResources = mockResources;
    if (disaster_id) {
      filteredResources = mockResources.filter(r => r.disaster_id === disaster_id);
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filteredResources.slice(start, end);
    
    return {
      data: paginatedData,
      total: filteredResources.length
    };
  }

  async createResource(resource: Omit<Resource, 'id' | 'created_at'>): Promise<Resource> {
    const newResource: Resource = {
      ...resource,
      id: `resource-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mockResources.push(newResource);
    return newResource;
  }

  // Social Media
  async getSocialMediaPosts(disaster_id: string, platform: string = 'twitter', limit: number = 20): Promise<SocialMediaPost[]> {
    const filteredPosts = mockSocialMediaPosts.filter(p => p.disaster_id === disaster_id);
    return filteredPosts.slice(0, limit);
  }

  async getUrgentSocialMediaPosts(disaster_id: string): Promise<SocialMediaPost[]> {
    return mockSocialMediaPosts.filter(p => p.disaster_id === disaster_id && p.priority === 'urgent');
  }
}

export const mockDataService = new MockDataService(); 