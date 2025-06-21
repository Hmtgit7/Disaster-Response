import { BskyAgent } from '@atproto/api';
import { SocialMediaPost } from '../types';
import { getCachedData, setCachedData } from './cacheService';
import logger from '../utils/logger';

interface BlueskyPostRecord {
  text: string;
  [key: string]: any;
}

export class BlueskyService {
  private agent: BskyAgent;
  private identifier: string;
  private password: string;

  constructor() {
    this.agent = new BskyAgent({
      service: 'https://bsky.social'
    });
    
    this.identifier = process.env.BLUESKY_IDENTIFIER || '';
    this.password = process.env.BLUESKY_PASSWORD || '';
  }

  /**
   * Initialize the Bluesky agent with credentials
   */
  private async initialize(): Promise<boolean> {
    try {
      if (!this.identifier || !this.password) {
        logger.warn('Bluesky credentials not configured');
        return false;
      }

      await this.agent.login({
        identifier: this.identifier,
        password: this.password
      });

      logger.info('Bluesky agent initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Bluesky agent', { error });
      return false;
    }
  }

  /**
   * Search for posts related to disaster keywords
   */
  async searchDisasterPosts(
    keywords: string[] = ['disaster', 'emergency', 'flood', 'fire', 'earthquake', 'hurricane', 'tornado'],
    limit: number = 20
  ): Promise<SocialMediaPost[]> {
    try {
      const cacheKey = `bluesky_search:${keywords.join(',')}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        logger.info('Bluesky search results retrieved from cache');
        return cached as SocialMediaPost[];
      }

      const initialized = await this.initialize();
      if (!initialized) {
        return this.getMockPosts(keywords, limit);
      }

      const posts: SocialMediaPost[] = [];
      const query = keywords.join(' OR ');

      try {
        const response = await this.agent.api.app.bsky.feed.searchPosts({
          q: query,
          limit: limit
        });

        if (response.data.posts) {
          for (const post of response.data.posts) {
            const record = post.record as BlueskyPostRecord;
            const socialMediaPost: SocialMediaPost = {
              id: post.uri,
              platform: 'bluesky',
              user: post.author.handle,
              content: record.text,
              timestamp: post.indexedAt,
              disaster_id: this.extractDisasterId(record.text),
              priority: this.classifyPriority(record.text),
              engagement: {
                likes: post.likeCount || 0,
                retweets: post.repostCount || 0,
                replies: post.replyCount || 0
              }
            };

            posts.push(socialMediaPost);
          }
        }

        // Cache results for 5 minutes
        await setCachedData(cacheKey, posts, 300);

        logger.info('Bluesky search completed', { 
          query, 
          resultsCount: posts.length 
        });

        return posts;
      } catch (searchError) {
        logger.error('Error searching Bluesky posts', { searchError });
        return this.getMockPosts(keywords, limit);
      }
    } catch (error) {
      logger.error('Error in Bluesky search', { error, keywords });
      return this.getMockPosts(keywords, limit);
    }
  }

  /**
   * Get posts from specific users (emergency services, government accounts)
   */
  async getOfficialUpdates(userHandles: string[] = [], limit: number = 20): Promise<SocialMediaPost[]> {
    try {
      const cacheKey = `bluesky_official:${userHandles.join(',')}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as SocialMediaPost[];
      }

      if (userHandles.length === 0) {
        // Default emergency service accounts on Bluesky
        userHandles = [
          'fema.bsky.social',
          'redcross.bsky.social',
          'weather.gov.bsky.social',
          'emergency.bsky.social'
        ];
      }

      const initialized = await this.initialize();
      if (!initialized) {
        return this.getMockPosts(['emergency', 'disaster'], limit);
      }

      const posts: SocialMediaPost[] = [];

      for (const handle of userHandles.slice(0, 5)) {
        try {
          const response = await this.agent.api.app.bsky.feed.getAuthorFeed({
            actor: handle,
            limit: Math.ceil(limit / userHandles.length)
          });

          if (response.data.feed) {
            for (const feedItem of response.data.feed) {
              if (feedItem.post) {
                const post = feedItem.post;
                const record = post.record as BlueskyPostRecord;
                const socialMediaPost: SocialMediaPost = {
                  id: post.uri,
                  platform: 'bluesky',
                  user: post.author.handle,
                  content: record.text,
                  timestamp: post.indexedAt,
                  disaster_id: this.extractDisasterId(record.text),
                  priority: this.classifyPriority(record.text),
                  engagement: {
                    likes: post.likeCount || 0,
                    retweets: post.repostCount || 0,
                    replies: post.replyCount || 0
                  }
                };

                posts.push(socialMediaPost);
              }
            }
          }
        } catch (userError) {
          logger.warn('Error fetching posts for user', { handle, error: userError });
        }
      }

      // Cache for 5 minutes
      await setCachedData(cacheKey, posts, 300);

      return posts.slice(0, limit);
    } catch (error) {
      logger.error('Error getting official updates from Bluesky', { error });
      return this.getMockPosts(['emergency', 'disaster'], limit);
    }
  }

  /**
   * Get trending topics related to disasters
   */
  async getTrendingTopics(): Promise<string[]> {
    try {
      const cacheKey = 'bluesky_trending_topics';
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as string[];
      }

      // For now, return disaster-related keywords
      // In a real implementation, you might use Bluesky's trending features
      const trendingTopics = [
        'disaster',
        'emergency',
        'flood',
        'fire',
        'earthquake',
        'hurricane',
        'tornado',
        'evacuation',
        'relief',
        'SOS'
      ];

      // Cache for 10 minutes
      await setCachedData(cacheKey, trendingTopics, 600);

      return trendingTopics;
    } catch (error) {
      logger.error('Error getting trending topics from Bluesky', { error });
      return ['disaster', 'emergency', 'flood', 'fire'];
    }
  }

  /**
   * Post a message to Bluesky (for official updates)
   */
  async postMessage(text: string): Promise<boolean> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }

      await this.agent.post({
        text: text
      });

      logger.info('Message posted to Bluesky successfully');
      return true;
    } catch (error) {
      logger.error('Error posting message to Bluesky', { error });
      return false;
    }
  }

  /**
   * Extract disaster ID from post content
   */
  private extractDisasterId(content: string): string {
    // Look for disaster IDs in the format disaster-123
    const match = content.match(/disaster-(\d+)/);
    return match ? match[1] : 'general';
  }

  /**
   * Classify post priority based on content
   */
  private classifyPriority(content: string): 'low' | 'medium' | 'high' | 'urgent' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('urgent') || lowerContent.includes('sos') || lowerContent.includes('emergency')) {
      return 'urgent';
    }
    
    if (lowerContent.includes('critical') || lowerContent.includes('severe') || lowerContent.includes('danger')) {
      return 'high';
    }
    
    if (lowerContent.includes('warning') || lowerContent.includes('alert') || lowerContent.includes('caution')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Fallback mock posts when API fails
   */
  private getMockPosts(keywords: string[], limit: number): SocialMediaPost[] {
    const mockPosts: SocialMediaPost[] = [
      {
        id: `mock-${Date.now()}-1`,
        platform: 'bluesky',
        user: 'emergency_services.bsky.social',
        content: `URGENT: ${keywords[0]} situation reported in downtown area. Evacuation orders issued. #emergency #${keywords[0]}`,
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        disaster_id: 'disaster-1',
        priority: 'urgent'
      },
      {
        id: `mock-${Date.now()}-2`,
        platform: 'bluesky',
        user: 'citizen_reporter.bsky.social',
        content: `Heavy ${keywords[0]} damage visible in residential area. Need immediate assistance! #${keywords[0]} #help`,
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        disaster_id: 'disaster-1',
        priority: 'high'
      },
      {
        id: `mock-${Date.now()}-3`,
        platform: 'bluesky',
        user: 'relief_worker.bsky.social',
        content: `Red Cross shelter now open for ${keywords[0]} victims. Food and medical assistance available. #relief`,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        disaster_id: 'disaster-1',
        priority: 'medium'
      }
    ];

    return mockPosts.slice(0, limit);
  }
}

export const blueskyService = new BlueskyService(); 