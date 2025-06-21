import express, { Request, Response } from 'express';
import { supabase } from '../config/database';

const router = express.Router();

// Mock function to fetch official updates
const fetchOfficialUpdates = async (disaster_id: string) => {
    // In a real application, this would fetch from a reliable source (e.g., government API)
    return [
        {
            id: 'update-1',
            source: 'National Weather Service',
            title: 'Flash Flood Warning Issued',
            content: 'A flash flood warning is in effect for the next 2 hours. Seek higher ground immediately.',
            url: '#',
            timestamp: new Date().toISOString(),
            disaster_id,
        },
        {
            id: 'update-2',
            source: 'Mayor\'s Office',
            title: 'Evacuation Centers Open',
            content: 'Evacuation centers are now open at City Hall and the Convention Center.',
            url: '#',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            disaster_id,
        },
    ];
};

/**
 * @route GET /api/official-updates
 * @description Get official updates for a disaster
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { disaster_id } = req.query;

        if (!disaster_id) {
            return res.status(400).json({ success: false, error: 'Disaster ID is required' });
        }

        const updates = await fetchOfficialUpdates(disaster_id as string);
        
        return res.json({
            success: true,
            data: updates,
            message: 'Official updates retrieved successfully.',
        });
    } catch (error: any) {
        console.error('Error fetching official updates:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router; 