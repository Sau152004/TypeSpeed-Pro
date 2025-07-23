const TestResult = require('../models/TestResult');
const { validationResult } = require('express-validator');

const testController = {
    // Save test result
    saveResult: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid test data',
                    errors: errors.array()
                });
            }
            
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const result = await TestResult.create(req.user.id, req.body);
            
            // Emit real-time update for leaderboard
            if (req.app.get('io')) {
                req.app.get('io').emit('new-result', {
                    userId: req.user.id,
                    username: req.user.username,
                    wpm: result.wpm,
                    accuracy: result.accuracy
                });
            }
            
            res.json({
                success: true,
                message: 'Test result saved',
                result: {
                    id: result.id,
                    wpm: result.wpm,
                    accuracy: result.accuracy,
                    createdAt: result.created_at
                }
            });
            
        } catch (error) {
            console.error('Save result error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save test result'
            });
        }
    },
    
    // Get test history
    getHistory: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const history = await TestResult.getHistory(req.user.id, page, limit);
            
            res.json({
                success: true,
                data: history
            });
            
        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch test history'
            });
        }
    },
    
    // Get test statistics
    getTestStats: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const timeframe = req.query.timeframe || 'all';
            const stats = await TestResult.getUserStats(req.user.id, timeframe);
            
            res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('Get test stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch test statistics'
            });
        }
    },
    
    // Delete test result
    deleteResult: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const resultId = req.params.id;
            const deleted = await TestResult.delete(resultId, req.user.id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Test result not found or access denied'
                });
            }
            
            res.json({
                success: true,
                message: 'Test result deleted successfully'
            });
            
        } catch (error) {
            console.error('Delete result error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete test result'
            });
        }
    }
};

module.exports = testController;