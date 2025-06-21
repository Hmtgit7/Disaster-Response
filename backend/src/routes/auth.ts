import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @description Mock user login
 * @access Public
 */
router.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    // In a real application, you would verify credentials against a database
    // and generate a real JWT token.
    const mockUser = {
        id: 'user-123',
        username: username,
        role: 'contributor',
    };

    const mockToken = `mock-jwt-token-for-${username}`;

    return res.json({
        success: true,
        data: {
            token: mockToken,
            user: mockUser,
        },
        message: 'Login successful.',
    });
});

export default router; 