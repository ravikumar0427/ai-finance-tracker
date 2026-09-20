import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAccountStats
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../utils/validators.js';

const router = express.Router();

// Strict rate limit for login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', loginLimiter, validateBody(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/profile', protect, validateBody(updateProfileSchema), updateProfile);
router.put('/password', protect, validateBody(changePasswordSchema), changePassword);
router.get('/stats', protect, getAccountStats);

export default router;
