import express, { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';

const router = express.Router();

/**
 * @route POST /api/verify/image
 * @description Verify the authenticity of an image
 * @access Public
 */
router.post('/image', async (req: Request, res: Response) => {
    try {
        const { image_url, disaster_context } = req.body;

        if (!image_url) {
            return res.status(400).json({ success: false, error: 'Image URL is required' });
        }

        const result = await geminiService.verifyImage(image_url, disaster_context);
        
        return res.json({
            success: true,
            data: result,
            message: 'Image verification completed.',
        });
    } catch (error: any) {
        console.error('Image verification error:', error);
        return res.status(500).json({ success: false, error: 'Server error during image verification' });
    }
});

export default router; 