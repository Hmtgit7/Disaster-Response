import express from 'express';
import { blueskyService } from '../services/blueskyService';
import { getCachedData, setCachedData } from '../services/cacheService';
import { mockDataService } from '../services/mockDataService';
import { SocialMediaPost, ApiResponse } from '../types';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/social-media
 * Get social media posts for a disaster
 */
router.get('/', async (req, res) => {
  try {
    const { disaster_id, platform = 'twitter', limit = 20, keywords } = req.query;

    if (!disaster_id) {
      return res.status(400).json({
        success: false,
        error: 'Disaster ID is required'
      });
    }

    // Check cache first (with error handling)
    let cached = null;
    const cacheKey = `social_media:${disaster_id}:${platform}:${limit}`;
    try {
      cached = await getCachedData(cacheKey);
      if (cached) {
        logger.info('Social media posts retrieved from cache', { disaster_id, platform });
        return res.json({
          success: true,
          data: cached,
          source: 'cache'
        });
      }
    } catch (cacheError) {
      logger.warn('Cache error, proceeding without cache', { cacheError });
    }

    let posts: SocialMediaPost[] = [];

    // Use real Twitter API if platform is twitter and API keys are available
    if (platform === 'twitter' && process.env.TWITTER_API_KEY) {
      try {
        const searchKeywords = keywords ? 
          (keywords as string).split(',').map(k => k.trim()) : 
          ['disaster', 'emergency', 'flood', 'fire', 'earthquake', 'hurricane', 'tornado'];
        
        posts = await blueskyService.searchDisasterPosts(searchKeywords, parseInt(limit as string));
        
        logger.info('Real Twitter data fetched', { disaster_id, platform, count: posts.length });
      } catch (twitterError) {
        logger.error('Twitter API error, falling back to mock data', { twitterError });
        posts = await mockDataService.getSocialMediaPosts(disaster_id as string, platform as string, parseInt(limit as string));
      }
    } else {
      // Fallback to mock data for other platforms or when Twitter API is not available
      posts = await mockDataService.getSocialMediaPosts(disaster_id as string, platform as string, parseInt(limit as string));
    }

    // Cache the results for 5 minutes (with error handling)
    try {
      await setCachedData(cacheKey, posts, 300);
    } catch (cacheError) {
      logger.warn('Failed to cache social media posts', { cacheError });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`disaster-${disaster_id}`).emit('social_media_updated', posts);

    logger.info('Social media posts fetched', { disaster_id, platform, count: posts.length });

    return res.json({
      success: true,
      data: posts,
      source: platform === 'twitter' && process.env.TWITTER_API_KEY ? 'twitter' : 'mock'
    });
  } catch (error) {
    logger.error('Error in GET /social-media', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/social-media/urgent
 * Get urgent social media posts
 */
router.get('/urgent', async (req, res) => {
  try {
    const { disaster_id, platform = 'twitter' } = req.query;

    if (!disaster_id) {
      return res.status(400).json({
        success: false,
        error: 'Disaster ID is required'
      });
    }

    let urgentPosts: SocialMediaPost[] = [];

    // Use real Twitter API for urgent posts if available
    if (platform === 'twitter' && process.env.TWITTER_API_KEY) {
      try {
        const allPosts = await blueskyService.searchDisasterPosts(['urgent', 'SOS', 'emergency', 'help'], 50);
        urgentPosts = allPosts.filter(post => post.priority === 'urgent' || post.priority === 'high');
        
        logger.info('Real Twitter urgent posts fetched', { disaster_id, count: urgentPosts.length });
      } catch (twitterError) {
        logger.error('Twitter API error for urgent posts, falling back to mock data', { twitterError });
        urgentPosts = await mockDataService.getUrgentSocialMediaPosts(disaster_id as string);
      }
    } else {
      // Fallback to mock data
      urgentPosts = await mockDataService.getUrgentSocialMediaPosts(disaster_id as string);
    }

    logger.info('Urgent social media posts fetched', { disaster_id, count: urgentPosts.length });

    return res.json({
      success: true,
      data: urgentPosts,
      source: platform === 'twitter' && process.env.TWITTER_API_KEY ? 'twitter' : 'mock'
    });
  } catch (error) {
    logger.error('Error in GET /social-media/urgent', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/social-media/search
 * Search for social media posts related to disasters
 */
router.get('/search', async (req, res) => {
  try {
    const { keywords, limit = 20 } = req.query;
    
    const keywordArray = keywords 
      ? (Array.isArray(keywords) ? keywords : [keywords]).map(k => k.toString())
      : ['disaster', 'emergency', 'flood', 'fire', 'earthquake', 'hurricane', 'tornado'];

    const posts = await blueskyService.searchDisasterPosts(
      keywordArray,
      parseInt(limit.toString())
    );

    res.json({
      success: true,
      data: posts,
      count: posts.length
    });
  } catch (error) {
    logger.error('Error searching social media posts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to search social media posts'
    });
  }
});

/**
 * GET /api/social-media/official
 * Get official updates from emergency services
 */
router.get('/official', async (req, res) => {
  try {
    const { userHandles, limit = 20 } = req.query;
    
    const handleArray = userHandles 
      ? (Array.isArray(userHandles) ? userHandles : [userHandles]).map(h => h.toString())
      : [];

    const posts = await blueskyService.getOfficialUpdates(
      handleArray,
      parseInt(limit.toString())
    );

    res.json({
      success: true,
      data: posts,
      count: posts.length
    });
  } catch (error) {
    logger.error('Error getting official updates', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get official updates'
    });
  }
});

/**
 * GET /api/social-media/trending
 * Get trending topics related to disasters
 */
router.get('/trending', async (req, res) => {
  try {
    const topics = await blueskyService.getTrendingTopics();

    res.json({
      success: true,
      data: topics,
      count: topics.length
    });
  } catch (error) {
    logger.error('Error getting trending topics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get trending topics'
    });
  }
});

/**
 * POST /api/social-media/post
 * Post a message to Bluesky (for official updates)
 */
router.post('/post', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    const success = await blueskyService.postMessage(text);

    if (success) {
      return res.json({
        success: true,
        message: 'Message posted successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to post message'
      });
    }
  } catch (error) {
    logger.error('Error posting message', { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to post message'
    });
  }
});

export default router; 