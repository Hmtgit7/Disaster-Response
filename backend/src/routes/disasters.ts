import express from 'express';
import { supabase } from '../config/database';
import { geocodingService } from '../services/geocodingService';
import { geminiService } from '../services/geminiService';
import { mockDataService } from '../services/mockDataService';
import { CreateDisasterRequest, UpdateDisasterRequest, Disaster, ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/disasters
 * Create a new disaster
 */
router.post('/', async (req, res) => {
  try {
    const { title, location_name, description, tags }: CreateDisasterRequest = req.body;
    const owner_id = req.headers['x-user-id'] as string || 'anonymous';

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    // Extract location from description if not provided
    let finalLocationName = location_name;
    if (!finalLocationName) {
      const extractedLocation = await geminiService.extractLocation(description);
      if (extractedLocation) {
        finalLocationName = extractedLocation.location_name;
      }
    }

    // Geocode the location
    let location = null;
    if (finalLocationName) {
      const geocoded = await geocodingService.geocode(finalLocationName);
      if (geocoded) {
        location = { lat: geocoded.lat, lng: geocoded.lng };
      }
    }

    try {
      // Try to create disaster in database
      const { data: disaster, error } = await supabase
        .from('disasters')
        .insert({
          title,
          location_name: finalLocationName || 'Unknown Location',
          location: location ? `POINT(${location.lng} ${location.lat})` : null,
          description,
          tags: tags || [],
          owner_id,
          audit_trail: [{
            action: 'create',
            user_id: owner_id,
            timestamp: new Date().toISOString()
          }]
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('disaster_updated', disaster);

      logger.info('Disaster created successfully', { disasterId: disaster.id, title });

      return res.status(201).json({
        success: true,
        data: disaster,
        message: 'Disaster created successfully'
      });
    } catch (dbError) {
      // Fallback to mock data service
      logger.warn('Database error, using mock data service', { dbError });
      
      const disaster = await mockDataService.createDisaster({
        title,
        location_name: finalLocationName || 'Unknown Location',
        location: location || { lat: 0, lng: 0 },
        description,
        tags: tags || [],
        owner_id,
        audit_trail: [{
          action: 'create',
          user_id: owner_id,
          timestamp: new Date().toISOString()
        }]
      });

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('disaster_updated', disaster);

      logger.info('Disaster created successfully (mock)', { disasterId: disaster.id, title });

      return res.status(201).json({
        success: true,
        data: disaster,
        message: 'Disaster created successfully (mock mode)'
      });
    }
  } catch (error) {
    logger.error('Error in POST /disasters', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/disasters
 * Get all disasters with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tag, 
      search, 
      owner_id,
      lat,
      lng,
      radius = 10000 // 10km default
    } = req.query;

    try {
      // Try to fetch from database
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = supabase
        .from('disasters')
        .select('*', { count: 'exact' });

      // Apply filters
      if (tag) {
        query = query.contains('tags', [tag as string]);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location_name.ilike.%${search}%`);
      }

      if (owner_id) {
        query = query.eq('owner_id', owner_id as string);
      }

      // Apply geospatial filter if coordinates provided
      if (lat && lng) {
        const point = `POINT(${lng} ${lat})`;
        query = query.filter('location', 'st_dwithin', `${point},${radius}`);
      }

      // Get total count
      const { count } = await query;

      // Get paginated results
      const { data: disasters, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit as string) - 1);

      if (error) {
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / parseInt(limit as string));

      const response: PaginatedResponse<Disaster> = {
        success: true,
        data: disasters || [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count || 0,
          totalPages
        }
      };

      return res.json(response);
    } catch (dbError) {
      // Fallback to mock data service
      logger.warn('Database error, using mock data service', { dbError });
      
      const result = await mockDataService.getDisasters(parseInt(page as string), parseInt(limit as string));
      
      const response: PaginatedResponse<Disaster> = {
        success: true,
        data: result.data,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit as string))
        }
      };

      return res.json(response);
    }
  } catch (error) {
    logger.error('Error in GET /disasters', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/disasters/:id
 * Get a specific disaster by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      // Try to fetch from database
      const { data: disaster, error } = await supabase
        .from('disasters')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !disaster) {
        throw new Error('Disaster not found');
      }

      return res.json({
        success: true,
        data: disaster
      });
    } catch (dbError) {
      // Fallback to mock data service
      logger.warn('Database error, using mock data service', { dbError });
      
      const disaster = await mockDataService.getDisasterById(id);
      
      if (!disaster) {
        return res.status(404).json({
          success: false,
          error: 'Disaster not found'
        });
      }

      return res.json({
        success: true,
        data: disaster
      });
    }
  } catch (error) {
    logger.error('Error in GET /disasters/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/disasters/:id
 * Update a disaster
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateDisasterRequest = req.body;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Check if disaster exists
    const { data: existingDisaster, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingDisaster) {
      return res.status(404).json({
        success: false,
        error: 'Disaster not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.tags) updateData.tags = updates.tags;

    // Handle location updates
    if (updates.location_name || updates.description) {
      let finalLocationName = updates.location_name || existingDisaster.location_name;
      
      // Extract location from description if location_name is not provided
      if (!updates.location_name && updates.description) {
        const extractedLocation = await geminiService.extractLocation(updates.description);
        if (extractedLocation) {
          finalLocationName = extractedLocation.location_name;
        }
      }

      // Geocode the location
      if (finalLocationName !== existingDisaster.location_name) {
        const geocoded = await geocodingService.geocode(finalLocationName);
        if (geocoded) {
          updateData.location_name = finalLocationName;
          updateData.location = `POINT(${geocoded.lng} ${geocoded.lat})`;
        }
      }
    }

    // Add audit trail entry
    const auditTrail = existingDisaster.audit_trail || [];
    auditTrail.push({
      action: 'update',
      user_id,
      timestamp: new Date().toISOString(),
      details: updates
    });

    updateData.audit_trail = auditTrail;
    updateData.updated_at = new Date().toISOString();

    // Update disaster
    const { data: updatedDisaster, error } = await supabase
      .from('disasters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating disaster', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to update disaster'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('disaster_updated', updatedDisaster);

    logger.info('Disaster updated successfully', { disasterId: id, user_id });

    return res.json({
      success: true,
      data: updatedDisaster,
      message: 'Disaster updated successfully'
    });
  } catch (error) {
    logger.error('Error in PUT /disasters/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/disasters/:id
 * Delete a disaster
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Check if disaster exists
    const { data: existingDisaster, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingDisaster) {
      return res.status(404).json({
        success: false,
        error: 'Disaster not found'
      });
    }

    // Delete disaster (cascade will handle related records)
    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting disaster', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to delete disaster'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('disaster_updated', { id, action: 'deleted' });

    logger.info('Disaster deleted successfully', { disasterId: id, user_id });

    return res.json({
      success: true,
      message: 'Disaster deleted successfully'
    });
  } catch (error) {
    logger.error('Error in DELETE /disasters/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/disasters/:id/statistics
 * Get disaster statistics
 */
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;

    // Get disaster details
    const { data: disaster } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (!disaster) {
      return res.status(404).json({
        success: false,
        error: 'Disaster not found'
      });
    }

    // Get related counts
    const [reportsCount, resourcesCount] = await Promise.all([
      supabase.from('reports').select('id', { count: 'exact' }).eq('disaster_id', id),
      supabase.from('resources').select('id', { count: 'exact' }).eq('disaster_id', id)
    ]);

    const statistics = {
      disaster,
      reports_count: reportsCount.count || 0,
      resources_count: resourcesCount.count || 0,
      created_at: disaster.created_at,
      updated_at: disaster.updated_at
    };

    return res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error in GET /disasters/:id/statistics', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 