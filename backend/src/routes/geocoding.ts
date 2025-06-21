import express, { Request, Response } from 'express';
import { geocodingService } from '../services/geocodingService';

const router = express.Router();

/**
 * @route POST /api/geocode
 * @description Geocode a location name to get coordinates
 * @access Public
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { location_name } = req.body;

        if (!location_name) {
            return res.status(400).json({ success: false, error: 'Location name is required' });
        }

        const result = await geocodingService.geocode(location_name);
        
        if (!result) {
            return res.status(404).json({ success: false, error: 'Location not found' });
        }

        return res.json({
            success: true,
            data: result,
            message: 'Geocoding successful.',
        });
    } catch (error: any) {
        console.error('Geocoding error:', error);
        return res.status(500).json({ success: false, error: 'Server error during geocoding' });
    }
});

export default router; 