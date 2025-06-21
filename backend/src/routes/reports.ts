import express from 'express';
import { supabase } from '../config/database';
import { geminiService } from '../services/geminiService';
import { mockDataService } from '../services/mockDataService';
import { CreateReportRequest, Report, ApiResponse } from '../types';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/reports
 * Create a new report
 */
router.post('/', async (req, res) => {
  try {
    const { disaster_id, content, image_url }: CreateReportRequest = req.body;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Validate required fields
    if (!disaster_id || !content) {
      return res.status(400).json({
        success: false,
        error: 'Disaster ID and content are required'
      });
    }

    // Verify image if provided
    let verification_status: 'pending' | 'verified' | 'rejected' = 'pending';
    if (image_url) {
      try {
        const verificationResult = await geminiService.verifyImage(image_url, content);
        verification_status = verificationResult.is_authentic ? 'verified' : 'rejected';
        
        logger.info('Image verification completed', { 
          image_url, 
          verification_status,
          confidence: verificationResult.confidence 
        });
      } catch (error) {
        logger.warn('Image verification failed, defaulting to pending', { error, image_url });
      }
    }

    try {
      // Try to create report in database
      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          disaster_id,
          user_id,
          content,
          image_url,
          verification_status
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Emit real-time update
      const io = req.app.get('io');
      io.to(`disaster-${disaster_id}`).emit('report_created', report);

      logger.info('Report created successfully', { reportId: report.id, disaster_id });

      return res.status(201).json({
        success: true,
        data: report,
        message: 'Report created successfully'
      });
    } catch (dbError) {
      // Fallback to mock data service
      logger.warn('Database error, using mock data service', { dbError });
      
      const report = await mockDataService.createReport({
        disaster_id,
        user_id,
        content,
        image_url,
        verification_status
      });

      // Emit real-time update
      const io = req.app.get('io');
      io.to(`disaster-${disaster_id}`).emit('report_created', report);

      logger.info('Report created successfully (mock)', { reportId: report.id, disaster_id });

      return res.status(201).json({
        success: true,
        data: report,
        message: 'Report created successfully (mock mode)'
      });
    }
  } catch (error) {
    logger.error('Error in POST /reports', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/reports
 * Get reports with filtering
 */
router.get('/', async (req, res) => {
  try {
    const { 
      disaster_id, 
      user_id, 
      verification_status,
      page = 1,
      limit = 20
    } = req.query;

    try {
      // Try to fetch from database
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = supabase
        .from('reports')
        .select('*', { count: 'exact' });

      // Apply filters
      if (disaster_id) {
        query = query.eq('disaster_id', disaster_id as string);
      }

      if (user_id) {
        query = query.eq('user_id', user_id as string);
      }

      if (verification_status) {
        query = query.eq('verification_status', verification_status as string);
      }

      // Get total count
      const { count } = await query;

      // Get paginated results
      const { data: reports, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit as string) - 1);

      if (error) {
        throw error;
      }

      return res.json({
        success: true,
        data: reports || [],
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
      
      const result = await mockDataService.getReports(
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
    logger.error('Error in GET /reports', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/reports/:id
 * Get a specific report by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error in GET /reports/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/reports/:id/verify
 * Update report verification status
 */
router.put('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verification_status, image_url } = req.body;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Check if report exists
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    let finalVerificationStatus = verification_status;

    // If image verification is requested and image URL is provided
    if (verification_status === 'pending' && image_url) {
      try {
        const verificationResult = await geminiService.verifyImage(image_url, existingReport.content);
        finalVerificationStatus = verificationResult.is_authentic ? 'verified' : 'rejected';
        
        logger.info('Image verification completed for report', { 
          reportId: id, 
          verification_status: finalVerificationStatus,
          confidence: verificationResult.confidence 
        });
      } catch (error) {
        logger.warn('Image verification failed for report', { error, reportId: id });
        finalVerificationStatus = 'rejected';
      }
    }

    // Update report
    const { data: updatedReport, error } = await supabase
      .from('reports')
      .update({
        verification_status: finalVerificationStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating report verification', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to update report verification'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`disaster-${existingReport.disaster_id}`).emit('report_verified', updatedReport);

    logger.info('Report verification updated', { reportId: id, verification_status: finalVerificationStatus, user_id });

    return res.json({
      success: true,
      data: updatedReport,
      message: 'Report verification updated successfully'
    });
  } catch (error) {
    logger.error('Error in PUT /reports/:id/verify', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/reports/:id
 * Delete a report
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.headers['x-user-id'] as string || 'anonymous';

    // Check if report exists
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Delete report
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting report', { error });
      return res.status(500).json({
        success: false,
        error: 'Failed to delete report'
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`disaster-${existingReport.disaster_id}`).emit('report_deleted', { id });

    logger.info('Report deleted successfully', { reportId: id, user_id });

    return res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    logger.error('Error in DELETE /reports/:id', { error });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 