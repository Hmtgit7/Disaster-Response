import { supabase } from '../config/database';
import { CacheEntry } from '../types';
import logger from '../utils/logger';

export class CacheService {
  /**
   * Get cached data by key
   */
  async get(key: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache has expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        // Remove expired cache entry
        await this.delete(key);
        return null;
      }

      logger.debug('Cache hit', { key });
      return data.value;
    } catch (error) {
      logger.error('Error getting cached data', { error, key });
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        throw error;
      }

      logger.debug('Cache set', { key, ttlSeconds });
    } catch (error) {
      logger.error('Error setting cached data', { error, key });
      throw error;
    }
  }

  /**
   * Delete cached data by key
   */
  async delete(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key);

      if (error) {
        throw error;
      }

      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Error deleting cached data', { error, key });
      throw error;
    }
  }

  /**
   * Clear all expired cache entries
   */
  async clearExpired(): Promise<void> {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw error;
      }

      logger.info('Expired cache entries cleared');
    } catch (error) {
      logger.error('Error clearing expired cache', { error });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ total: number; expired: number }> {
    try {
      const { data: totalData, error: totalError } = await supabase
        .from('cache')
        .select('key', { count: 'exact' });

      const { data: expiredData, error: expiredError } = await supabase
        .from('cache')
        .select('key', { count: 'exact' })
        .lt('expires_at', new Date().toISOString());

      if (totalError || expiredError) {
        throw totalError || expiredError;
      }

      return {
        total: totalData?.length || 0,
        expired: expiredData?.length || 0
      };
    } catch (error) {
      logger.error('Error getting cache stats', { error });
      return { total: 0, expired: 0 };
    }
  }
}

export const cacheService = new CacheService();

// Convenience functions for external use
export const getCachedData = (key: string): Promise<any | null> => {
  return cacheService.get(key);
};

export const setCachedData = (key: string, value: any, ttlSeconds: number = 3600): Promise<void> => {
  return cacheService.set(key, value, ttlSeconds);
};

export const deleteCachedData = (key: string): Promise<void> => {
  return cacheService.delete(key);
};

// Schedule cache cleanup every hour
setInterval(() => {
  cacheService.clearExpired().catch(error => {
    logger.error('Scheduled cache cleanup failed', { error });
  });
}, 60 * 60 * 1000); // 1 hour 