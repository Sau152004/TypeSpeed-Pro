const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { 
    settingsValidation, 
    profileValidation, 
    passwordChangeValidation,
    timeframeValidation 
} = require('../middleware/validation');
const userController = require('../controllers/userController');

const router = express.Router();

// Get user profile
router.get('/profile', requireAuth, userController.getProfile);

// Update user profile
router.patch('/profile', requireAuth, profileValidation, userController.updateProfile);

// Update user settings
router.patch('/settings', requireAuth, settingsValidation, userController.updateSettings);

// Get user statistics
router.get('/stats', requireAuth, timeframeValidation, userController.getStats);

// Get personal best
router.get('/personal-best', requireAuth, userController.getPersonalBest);

// Change password
router.post('/change-password', requireAuth, passwordChangeValidation, userController.changePassword);

// Delete account
router.delete('/account', requireAuth, userController.deleteAccount);

module.exports = router;