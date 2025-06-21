import express from 'express';
import { realTimeDataService } from '../services/realTimeDataService';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/realtime
 * Get all real-time disaster data from multiple sources
 */
router.get('/', async (req, res) => {
  try {
    const { disaster_id } = req.query;

    const realTimeData = await realTimeDataService.getRealTimeDisasterData(
      disaster_id as string
    );

    logger.info('Real-time data fetched', { 
      disasterId: disaster_id,
      disastersCount: realTimeData.disasters.length,
      socialMediaCount: realTimeData.socialMedia.length,
      weatherCount: realTimeData.weather.length,
      emergencyAlertsCount: realTimeData.emergencyAlerts.length,
      resourcesCount: realTimeData.resources.length
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...realTimeData,
        timestamp: new Date().toISOString(),
        sources: [
          'twitter',
          'weather_service',
          'fema',
          'red_cross',
          'emergency_services'
        ]
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error in GET /realtime', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/realtime/disasters
 * Get real-time disasters from multiple sources
 */
router.get('/disasters', async (req, res) => {
  try {
    const { disaster_id } = req.query;

    const disasters = await realTimeDataService.getRealTimeDisasters(
      disaster_id as string
    );

    logger.info('Real-time disasters fetched', { 
      disasterId: disaster_id,
      count: disasters.length
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        disasters,
        timestamp: new Date().toISOString(),
        sources: ['twitter', 'weather_service', 'emergency_services']
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error in GET /realtime/disasters', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/realtime/social-media
 * Get real-time social media posts
 */
router.get('/social-media', async (req, res) => {
  try {
    const { disaster_id } = req.query;

    const socialMedia = await realTimeDataService.getRealTimeSocialMedia(
      disaster_id as string
    );

    logger.info('Real-time social media fetched', { 
      disasterId: disaster_id,
      count: socialMedia.length
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        socialMedia,
        timestamp: new Date().toISOString(),
        sources: ['twitter', 'official_accounts']
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error in GET /realtime/social-media', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/realtime/weather
 * Get real-time weather alerts
 */
router.get('/weather', async (req, res) => {
  try {
    const { disaster_id } = req.query;

    const weather = await realTimeDataService.getRealTimeWeather(
      disaster_id as string
    );

    logger.info('Real-time weather fetched', { 
      disasterId: disaster_id,
      count: weather.length
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        weather,
        timestamp: new Date().toISOString(),
        sources: ['national_weather_service']
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error in GET /realtime/weather', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/realtime/emergency-alerts
 * Get real-time emergency alerts
 */
router.get('/emergency-alerts', async (req, res) => {
  try {
    const { disaster_id } = req.query;

    const emergencyAlerts = await realTimeDataService.getRealTimeEmergencyAlerts(
      disaster_id as string
    );

    logger.info('Real-time emergency alerts fetched', { 
      disasterId: disaster_id,
      count: emergencyAlerts.length
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        emergencyAlerts,
        timestamp: new Date().toISOString(),
        sources: ['fema', 'emergency_services']
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error in GET /realtime/emergency-alerts', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/realtime/resources
 * Get real-time resources
 */
router.get('/resources', async (req, res) => {
  try {
    const { disaster_id } = req.query;

    const resources = await realTimeDataService.getRealTimeResources(
      disaster_id as string
    );

    logger.info('Real-time resources fetched', { 
      disasterId: disaster_id,
      count: resources.length
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        resources,
        timestamp: new Date().toISOString(),
        sources: ['red_cross', 'emergency_services']
      }
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error in GET /realtime/resources', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/realtime/status
 * Get status of real-time data sources
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      twitter: !!process.env.TWITTER_API_KEY,
      weather: true, // National Weather Service is free
      emergency: true, // FEMA API is public
      redCross: true, // Red Cross API is public
      timestamp: new Date().toISOString(),
      polling: {
        enabled: true,
        interval: 30000, // 30 seconds
        lastUpdate: new Date().toISOString()
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: status
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error in GET /realtime/status', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 