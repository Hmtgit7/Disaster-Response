import axios from 'axios';
import { GeocodingResult } from '../types';
import { getCachedData, setCachedData } from './cacheService';
import logger from '../utils/logger';

export class GeocodingService {
  /**
   * Geocode location name to coordinates using OpenStreetMap Nominatim
   * Free service, no API key required
   */
  async geocode(locationName: string): Promise<GeocodingResult | null> {
    try {
      const cacheKey = `geocoding:${Buffer.from(locationName).toString('base64')}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        logger.info('Geocoding result retrieved from cache', { locationName });
        return cached as GeocodingResult;
      }

      const result = await this.geocodeWithOpenStreetMap(locationName);

      if (result) {
        // Cache the result for 24 hours
        await setCachedData(cacheKey, result, 86400);
        logger.info('Location geocoded successfully', { locationName, result });
      } else {
        logger.warn('Failed to geocode location', { locationName });
      }

      return result;
    } catch (error) {
      logger.error('Error in geocoding service', { error, locationName });
      return null;
    }
  }

  /**
   * Geocode using OpenStreetMap Nominatim (free, no API key required)
   */
  private async geocodeWithOpenStreetMap(locationName: string): Promise<GeocodingResult | null> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: locationName,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'DisasterResponsePlatform/1.0'
        }
      });

      const data = response.data;
      
      if (data && data.length > 0) {
        const result = data[0];
        
        return {
          location_name: locationName,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          formatted_address: result.display_name
        };
      }

      logger.warn('OpenStreetMap geocoding failed', { locationName });
      return null;
    } catch (error) {
      logger.error('OpenStreetMap geocoding error', { error, locationName });
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to location name
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const cacheKey = `reverse_geocoding:${lat},${lng}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as string;
      }

      const locationName = await this.reverseGeocodeWithOpenStreetMap(lat, lng);

      if (locationName) {
        // Cache the result for 24 hours
        await setCachedData(cacheKey, locationName, 86400);
      }

      return locationName;
    } catch (error) {
      logger.error('Error in reverse geocoding', { error, lat, lng });
      return null;
    }
  }

  /**
   * Reverse geocode using OpenStreetMap Nominatim
   */
  private async reverseGeocodeWithOpenStreetMap(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'DisasterResponsePlatform/1.0'
        }
      });

      const data = response.data;
      
      if (data && data.display_name) {
        return data.display_name;
      }

      return null;
    } catch (error) {
      logger.error('OpenStreetMap reverse geocoding error', { error, lat, lng });
      return null;
    }
  }
}

export const geocodingService = new GeocodingService(); 