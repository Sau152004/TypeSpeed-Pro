const User = require('../models/User');
const TestResult = require('../models/TestResult');

const apiController = {
    saveTestResult: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const result = await TestResult.create(req.user.id, req.body);
            
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
    
    getUserStats: async (req, res) => {
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
    
    getTestHistory: async (req, res) => {
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
    
    getLeaderboard: async (req, res) => {
        try {
            const timeframe = req.query.timeframe || 'all';
            const limit = parseInt(req.query.limit) || 10;
            
            const leaderboard = await TestResult.getLeaderboard(timeframe, limit);
            
            res.json({
                success: true,
                data: {
                    leaderboard,
                    timeframe
                }
            });
            
        } catch (error) {
            console.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard'
            });
        }
    }
};

module.exports = apiController;