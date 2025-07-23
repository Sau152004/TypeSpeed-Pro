const User = require('../models/User');
const TestResult = require('../models/TestResult');
const { validationResult } = require('express-validator');

const userController = {
    // Get user profile
    getProfile: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const stats = await User.getStats(req.user.id);
            const personalBest = await User.getPersonalBest(req.user.id);
            const userRank = await TestResult.getUserRank(req.user.id);
            
            res.json({
                success: true,
                data: {
                    user: req.user,
                    stats,
                    personalBest,
                    rank: userRank
                }
            });
            
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    },
    
    // Update user settings
    updateSettings: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid settings data',
                    errors: errors.array()
                });
            }
            
            await User.updateSettings(req.user.id, req.body);
            
            res.json({
                success: true,
                message: 'Settings updated successfully'
            });
            
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update settings'
            });
        }
    },
    
    // Get user statistics
    getStats: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const timeframe = req.query.timeframe || 'all';
            const stats = await User.getStats(req.user.id, timeframe);
            
            res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch statistics'
            });
        }
    },
    
    // Get personal best
    getPersonalBest: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const personalBest = await User.getPersonalBest(req.user.id);
            
            res.json({
                success: true,
                personalBest
            });
            
        } catch (error) {
            console.error('Get personal best error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch personal best'
            });
        }
    },
    
    // Update user profile
    updateProfile: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid profile data',
                    errors: errors.array()
                });
            }
            
            const { username, email } = req.body;
            const updated = await User.updateProfile(req.user.id, { username, email });
            
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }
            
            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
            
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    },
    
    // Delete user account
    deleteAccount: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const { password } = req.body;
            
            // Verify password before deletion
            const isValid = await User.verifyPassword(req.user.email, password);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid password'
                });
            }
            
            await User.delete(req.user.id);
            
            // Logout user
            req.logout((err) => {
                if (err) {
                    console.error('Logout error:', err);
                }
                res.json({
                    success: true,
                    message: 'Account deleted successfully'
                });
            });
            
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete account'
            });
        }
    }
};

module.exports = userController;