import express from 'express';
import { supabase } from '../config/database';
import { geocodingService } from '../services/geocodingService';
import { mockDataService } from '../services/mockDataService';
import { CreateResourceRequest, Resource, ApiResponse } from '../types';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/resources
 * Create a new resource
 */
router.post('/', async (req, res) => {
  try {
    const { disaster_id, name, location_name, type, capacity }: CreateResourceRequest = req.body;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Validate required fields
    if (!disaster_id || !name || !location_name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Disaster ID, name, location name, and type are required'
      });
    }

    // Geocode the location
    let location = null;
    const geocoded = await geocodingService.geocode(location_name);
    if (geocoded) {
      location = { lat: geocoded.lat, lng: geocoded.lng };
    }

    try {
      // Try to create resource in database
      const { data: resource, error } = await supabase
        .from('resources')
        .insert({
          disaster_id,
          name,
          location_name,
          location: location ? `POINT(${location.lng} ${location.lat})` : null,
          type,
          capacity: capacity || undefined,
          available: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Emit real-time update
      const io = req.app.get('io');
      io.to(`disaster-${disaster_id}`).emit('resources_updated', [resource]);

      logger.info('Resource created successfully', { resourceId: resource.id, disaster_id, name });

      return res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully'
      });
    } catch (dbError) {
      // Fallback to mock data service
      logger.warn('Database error, using mock data service', { dbError });
      
      const resource = await mockDataService.createResource({
        disaster_id,
        name,
        location_name,
        location: location || { lat: 0, lng: 0 },
        type,
        capacity: capacity || undefined,
        available: true
      });

      // Emit real-time update
      const io = req.app.get('io');
      io.to(`disaster-${disaster_id}`).emit('resources_updated', [resource]);

      logger.info('Resource created successfully (mock)', { resourceId: resource.id, disaster_id, name });

      return res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully (mock mode)'
      });
    }
  } catch (error) {
    logger.error('Error in POST /resources', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/resources
 * Get resources with geospatial filtering
 */
router.get('/', async (req, res) => {
  try {
    const { 
      disaster_id, 
      type, 
      available,
      lat,
      lng,
      radius = 10000, // 10km default
      page = 1,
      limit = 20
    } = req.query;

    try {
      // Try to fetch from database
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = supabase
        .from('resources')
        .select('*', { count: 'exact' });

      // Apply filters
      if (disaster_id) {
        query = query.eq('disaster_id', disaster_id as string);
      }

      if (type) {
        query = query.eq('type', type as string);
      }

      if (available !== undefined) {
        query = query.eq('available', available === 'true');
      }

      // Apply geospatial filter if coordinates provided
      if (lat && lng) {
        const point = `POINT(${lng} ${lat})`;
        query = query.filter('location', 'st_dwithin', `${point},${radius}`);
      }

      // Get total count
      const { count } = await query;

      // Get paginated results
      const { data: resources, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit as string) - 1);

      if (error) {
        throw error;
      }

      return res.json({
        success: true,
        data: resources || [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / parseInt(limit as string))
        }
      });
    } catch (dbError) {
      // Fallback to mock data service
      logger.warn('Database error, using mock data service', { dbError });
      
      const result = await mockDataService.getResources(
        parseInt(page as string), 
        parseInt(limit as string), 
        disaster_id as string
      );

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit as string))
        }
      });
    }
  } catch (error) {
    logger.error('Error in GET /resources', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/resources/nearby
 * Get resources near a specific location
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, type, disaster_id } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    let query = supabase
      .from('resources')
      .select('*')
      .filter('location', 'st_dwithin', `POINT(${lng} ${lat}),${radius}`);

    // Apply additional filters
    if (type) {
      query = query.eq('type', type as string);
    }

    if (disaster_id) {
      query = query.eq('disaster_id', disaster_id as string);
    }

    const { data: resources, error } = await query
      .order('location', { ascending: true })
      .limit(50);

    if (error) {
      logger.error('Error fetching nearby resources', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch nearby resources'
      });
    }

    logger.info('Nearby resources fetched', { 
      lat, 
      lng, 
      radius, 
      count: resources?.length || 0 
    });

    return res.json({
      success: true,
      data: resources || [],
      query: { lat, lng, radius, type, disaster_id }
    });
  } catch (error) {
    logger.error('Error in GET /resources/nearby', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/resources/:id
 * Get a specific resource by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    return res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    logger.error('Error in GET /resources/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/resources/:id
 * Update a resource
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Check if resource exists
    const { data: existingResource, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingResource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.type) updateData.type = updates.type;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.available !== undefined) updateData.available = updates.available;

    // Handle location updates
    if (updates.location_name && updates.location_name !== existingResource.location_name) {
      const geocoded = await geocodingService.geocode(updates.location_name);
      if (geocoded) {
        updateData.location_name = updates.location_name;
        updateData.location = `POINT(${geocoded.lng} ${geocoded.lat})`;
      }
    }

    // Update resource
    const { data: updatedResource, error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating resource', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to update resource'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`disaster-${existingResource.disaster_id}`).emit('resources_updated', [updatedResource]);

    logger.info('Resource updated successfully', { resourceId: id, user_id });

    return res.json({
      success: true,
      data: updatedResource,
      message: 'Resource updated successfully'
    });
  } catch (error) {
    logger.error('Error in PUT /resources/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/resources/:id
 * Delete a resource
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Check if resource exists
    const { data: existingResource, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingResource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Delete resource
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting resource', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to delete resource'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`disaster-${existingResource.disaster_id}`).emit('resource_deleted', { id });

    logger.info('Resource deleted successfully', { resourceId: id, user_id });

    return res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    logger.error('Error in DELETE /resources/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 