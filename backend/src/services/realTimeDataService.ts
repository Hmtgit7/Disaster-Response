import axios from 'axios';
import { Disaster, SocialMediaPost, Resource, Report } from '../types';
import { blueskyService } from './blueskyService';
import { getCachedData, setCachedData } from './cacheService';
import logger from '../utils/logger';

export class RealTimeDataService {
  private blueskyService: typeof blueskyService;
  private weatherApiKey: string;
  private emergencyApiKey: string;

  constructor() {
    this.blueskyService = blueskyService;
    this.weatherApiKey = process.env.WEATHER_API_KEY || '';
    this.emergencyApiKey = process.env.EMERGENCY_API_KEY || '';
  }

  /**
   * Get real-time disaster data from multiple sources
   */
  async getRealTimeDisasterData(disasterId?: string): Promise<{
    disasters: Disaster[];
    socialMedia: SocialMediaPost[];
    weather: any[];
    emergencyAlerts: any[];
    resources: Resource[];
    reports: Report[];
  }> {
    try {
      const [
        disasters,
        socialMedia,
        weather,
        emergencyAlerts,
        resources,
        reports
      ] = await Promise.allSettled([
        this.getRealTimeDisasters(disasterId),
        this.getRealTimeSocialMedia(disasterId),
        this.getRealTimeWeather(disasterId),
        this.getRealTimeEmergencyAlerts(disasterId),
        this.getRealTimeResources(disasterId),
        this.getRealTimeReports(disasterId)
      ]);

      return {
        disasters: disasters.status === 'fulfilled' ? disasters.value : [],
        socialMedia: socialMedia.status === 'fulfilled' ? socialMedia.value : [],
        weather: weather.status === 'fulfilled' ? weather.value : [],
        emergencyAlerts: emergencyAlerts.status === 'fulfilled' ? emergencyAlerts.value : [],
        resources: resources.status === 'fulfilled' ? resources.value : [],
        reports: reports.status === 'fulfilled' ? reports.value : []
      };
    } catch (error) {
      logger.error('Error fetching real-time disaster data', { error });
      return {
        disasters: [],
        socialMedia: [],
        weather: [],
        emergencyAlerts: [],
        resources: [],
        reports: []
      };
    }
  }

  /**
   * Get real-time disasters from multiple sources
   */
  async getRealTimeDisasters(disasterId?: string): Promise<Disaster[]> {
    try {
      const cacheKey = `realtime_disasters:${disasterId || 'all'}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as Disaster[];
      }

      const disasters: Disaster[] = [];

      // 1. Get disasters from Bluesky mentions
      try {
        const blueskyDisasters = await this.getDisastersFromBluesky();
        disasters.push(...blueskyDisasters);
      } catch (error) {
        logger.warn('Failed to get disasters from Bluesky', { error });
      }

      // 2. Get disasters from emergency services APIs
      try {
        const emergencyDisasters = await this.getDisastersFromEmergencyServices();
        disasters.push(...emergencyDisasters);
      } catch (error) {
        logger.warn('Failed to get disasters from emergency services', { error });
      }

      // 3. Get disasters from weather alerts
      try {
        const weatherDisasters = await this.getDisastersFromWeatherAlerts();
        disasters.push(...weatherDisasters);
      } catch (error) {
        logger.warn('Failed to get disasters from weather alerts', { error });
      }

      // Filter by disaster ID if provided
      const filteredDisasters = disasterId 
        ? disasters.filter(d => d.id === disasterId)
        : disasters;

      // Cache for 2 minutes
      await setCachedData(cacheKey, filteredDisasters, 120);

      return filteredDisasters;
    } catch (error) {
      logger.error('Error getting real-time disasters', { error });
      return [];
    }
  }

  /**
   * Get real-time social media posts
   */
  async getRealTimeSocialMedia(disasterId?: string): Promise<SocialMediaPost[]> {
    try {
      const cacheKey = `realtime_social:${disasterId || 'all'}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as SocialMediaPost[];
      }

      const posts: SocialMediaPost[] = [];

      // 1. Get Bluesky posts
      try {
        const blueskyPosts = await this.blueskyService.searchDisasterPosts(
          ['disaster', 'emergency', 'flood', 'fire', 'earthquake', 'hurricane', 'tornado'],
          50
        );
        posts.push(...blueskyPosts);
      } catch (error) {
        logger.warn('Failed to get Bluesky posts', { error });
      }

      // 2. Get official updates
      try {
        const officialPosts = await this.blueskyService.getOfficialUpdates();
        posts.push(...officialPosts);
      } catch (error) {
        logger.warn('Failed to get official updates', { error });
      }

      // Filter by disaster ID if provided
      const filteredPosts = disasterId 
        ? posts.filter(p => p.disaster_id === disasterId)
        : posts;

      // Cache for 1 minute
      await setCachedData(cacheKey, filteredPosts, 60);

      return filteredPosts;
    } catch (error) {
      logger.error('Error getting real-time social media', { error });
      return [];
    }
  }

  /**
   * Get real-time weather data
   */
  async getRealTimeWeather(disasterId?: string): Promise<any[]> {
    try {
      const cacheKey = `realtime_weather:${disasterId || 'all'}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as any[];
      }

      const weatherData: any[] = [];

      // Get weather alerts from National Weather Service (free API)
      try {
        const response = await axios.get('https://api.weather.gov/alerts/active', {
          timeout: 5000
        });

        if (response.data && response.data.features) {
          const alerts = response.data.features.map((feature: any) => ({
            id: feature.id,
            type: feature.properties.event,
            severity: feature.properties.severity,
            area: feature.properties.areaDesc,
            description: feature.properties.description,
            effective: feature.properties.effective,
            expires: feature.properties.expires,
            coordinates: feature.geometry?.coordinates || []
          }));

          weatherData.push(...alerts);
        }
      } catch (error) {
        logger.warn('Failed to get weather alerts', { error });
      }

      // Cache for 5 minutes
      await setCachedData(cacheKey, weatherData, 300);

      return weatherData;
    } catch (error) {
      logger.error('Error getting real-time weather', { error });
      return [];
    }
  }

  /**
   * Get real-time emergency alerts
   */
  async getRealTimeEmergencyAlerts(disasterId?: string): Promise<any[]> {
    try {
      const cacheKey = `realtime_emergency:${disasterId || 'all'}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as any[];
      }

      const alerts: any[] = [];

      // Get FEMA alerts (using their public API)
      try {
        const response = await axios.get('https://www.fema.gov/api/open/v1/DisasterDeclarationsSummaries', {
          params: {
            $filter: "declarationDate gt '2024-01-01'",
            $top: 50
          },
          timeout: 5000
        });

        if (response.data && response.data.DisasterDeclarationsSummaries) {
          const femaAlerts = response.data.DisasterDeclarationsSummaries.map((disaster: any) => ({
            id: disaster.disasterNumber,
            type: disaster.incidentType,
            state: disaster.state,
            county: disaster.designatedArea,
            declarationDate: disaster.declarationDate,
            title: `${disaster.incidentType} in ${disaster.state}`,
            description: `Federal disaster declaration for ${disaster.incidentType} in ${disaster.state}`
          }));

          alerts.push(...femaAlerts);
        }
      } catch (error) {
        logger.warn('Failed to get FEMA alerts', { error });
      }

      // Cache for 10 minutes
      await setCachedData(cacheKey, alerts, 600);

      return alerts;
    } catch (error) {
      logger.error('Error getting real-time emergency alerts', { error });
      return [];
    }
  }

  /**
   * Get real-time resources
   */
  async getRealTimeResources(disasterId?: string): Promise<Resource[]> {
    try {
      const cacheKey = `realtime_resources:${disasterId || 'all'}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as Resource[];
      }

      const resources: Resource[] = [];

      // Get Red Cross shelter data
      try {
        const response = await axios.get('https://maps.redcross.org/website/maps/arcgis/rest/services/Public/RedCrossShelters/MapServer/0/query', {
          params: {
            f: 'json',
            where: '1=1',
            outFields: '*',
            returnGeometry: true
          },
          timeout: 5000
        });

        if (response.data && response.data.features) {
          const redCrossResources = response.data.features.map((feature: any) => ({
            id: `redcross-${feature.attributes.OBJECTID}`,
            disaster_id: disasterId || 'general',
            name: feature.attributes.ShelterName || 'Red Cross Shelter',
            location_name: feature.attributes.Address || 'Unknown Location',
            location: {
              lat: feature.geometry?.y || 0,
              lng: feature.geometry?.x || 0
            },
            type: 'shelter',
            capacity: feature.attributes.Capacity || undefined,
            available: true,
            created_at: new Date().toISOString()
          }));

          resources.push(...redCrossResources);
        }
      } catch (error) {
        logger.warn('Failed to get Red Cross resources', { error });
      }

      // Cache for 15 minutes
      await setCachedData(cacheKey, resources, 900);

      return resources;
    } catch (error) {
      logger.error('Error getting real-time resources', { error });
      return [];
    }
  }

  /**
   * Get real-time reports
   */
  async getRealTimeReports(disasterId?: string): Promise<Report[]> {
    try {
      const cacheKey = `realtime_reports:${disasterId || 'all'}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as Report[];
      }

      // For now, return empty array as reports are typically user-generated
      // In a real implementation, you might integrate with citizen reporting platforms
      const reports: Report[] = [];

      // Cache for 5 minutes
      await setCachedData(cacheKey, reports, 300);

      return reports;
    } catch (error) {
      logger.error('Error getting real-time reports', { error });
      return [];
    }
  }

  /**
   * Extract disasters from Bluesky mentions
   */
  private async getDisastersFromBluesky(): Promise<Disaster[]> {
    try {
      const posts = await this.blueskyService.searchDisasterPosts(
        ['disaster', 'emergency', 'flood', 'fire', 'earthquake', 'hurricane', 'tornado'],
        20
      );

      return posts.map(post => ({
        id: `bluesky-${post.id}`,
        title: this.extractDisasterTitle(post.content),
        location_name: 'Unknown Location', // Bluesky posts don't have location in our current type
        location: { lat: 0, lng: 0 }, // Default location
        description: post.content,
        tags: this.extractTags(post.content),
        owner_id: post.user,
        created_at: post.timestamp,
        updated_at: post.timestamp,
        audit_trail: []
      }));
    } catch (error) {
      logger.error('Error extracting disasters from Bluesky', { error });
      return [];
    }
  }

  /**
   * Get disasters from emergency services APIs
   */
  private async getDisastersFromEmergencyServices(): Promise<Disaster[]> {
    try {
      // This would integrate with emergency services APIs
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error getting disasters from emergency services', { error });
      return [];
    }
  }

  /**
   * Get disasters from weather alerts
   */
  private async getDisastersFromWeatherAlerts(): Promise<Disaster[]> {
    try {
      const weatherAlerts = await this.getRealTimeWeather();
      
      return weatherAlerts.map(alert => ({
        id: `weather-${alert.id}`,
        title: `${alert.type} Alert`,
        location_name: alert.area || 'Unknown Location',
        location: { lat: 0, lng: 0 }, // Would need to geocode the area
        description: alert.description || `Weather alert: ${alert.type}`,
        tags: ['weather', alert.type.toLowerCase(), 'alert'],
        owner_id: 'weather_service',
        created_at: alert.effective || new Date().toISOString(),
        updated_at: alert.expires || new Date().toISOString(),
        audit_trail: []
      }));
    } catch (error) {
      logger.error('Error getting disasters from weather alerts', { error });
      return [];
    }
  }

  /**
   * Extract disaster title from content
   */
  private extractDisasterTitle(content: string): string {
    const words = content.split(' ');
    const disasterKeywords = ['disaster', 'emergency', 'flood', 'fire', 'earthquake', 'hurricane', 'tornado'];
    
    for (const keyword of disasterKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Emergency`;
      }
    }
    
    return 'Emergency Situation';
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const disasterKeywords = ['disaster', 'emergency', 'flood', 'fire', 'earthquake', 'hurricane', 'tornado'];
    
    for (const keyword of disasterKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }

  /**
   * Start real-time data polling
   */
  startRealTimePolling(io: any, intervalMs: number = 30000) {
    setInterval(async () => {
      try {
        const realTimeData = await this.getRealTimeDisasterData();
        
        // Emit updates to all connected clients
        io.emit('realtime_update', {
          timestamp: new Date().toISOString(),
          data: realTimeData
        });

        // Emit specific updates for each disaster
        for (const disaster of realTimeData.disasters) {
          io.to(`disaster-${disaster.id}`).emit('disaster_realtime_update', {
            disasterId: disaster.id,
            timestamp: new Date().toISOString(),
            data: {
              socialMedia: realTimeData.socialMedia.filter(s => s.disaster_id === disaster.id),
              weather: realTimeData.weather,
              emergencyAlerts: realTimeData.emergencyAlerts,
              resources: realTimeData.resources.filter(r => r.disaster_id === disaster.id)
            }
          });
        }

        logger.info('Real-time data polling completed', { 
          disastersCount: realTimeData.disasters.length,
          socialMediaCount: realTimeData.socialMedia.length,
          weatherCount: realTimeData.weather.length
        });
      } catch (error) {
        logger.error('Error in real-time polling', { error });
      }
    }, intervalMs);

    logger.info('Real-time data polling started', { intervalMs });
  }
}

export const realTimeDataService = new RealTimeDataService(); 