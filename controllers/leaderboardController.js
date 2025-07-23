const TestResult = require('../models/TestResult');

const leaderboardController = {
    // Get leaderboard
    getLeaderboard: async (req, res) => {
        try {
            const timeframe = req.query.timeframe || 'all';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const leaderboard = await TestResult.getLeaderboard(timeframe, limit);
            const globalStats = await TestResult.getGlobalStats();
            
            res.json({
                success: true,
                data: {
                    leaderboard,
                    globalStats,
                    timeframe,
                    page,
                    limit
                }
            });
            
        } catch (error) {
            console.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard'
            });
        }
    },
    
    // Get user's rank in leaderboard
    getUserRank: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            const timeframe = req.query.timeframe || 'all';
            const rank = await TestResult.getUserRank(req.user.id, timeframe);
            
            res.json({
                success: true,
                data: {
                    rank,
                    timeframe
                }
            });
            
        } catch (error) {
            console.error('Get user rank error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user rank'
            });
        }
    },
    
    // Get leaderboard page (HTML)
    getLeaderboardPage: async (req, res) => {
        try {
            const timeframe = req.query.timeframe || 'all';
            const leaderboard = await TestResult.getLeaderboard(timeframe, 50);
            const globalStats = await TestResult.getGlobalStats();
            
            let userRank = null;
            if (req.user) {
                userRank = await TestResult.getUserRank(req.user.id, timeframe);
            }
            
            res.render('pages/leaderboard.njk', {
                title: 'Leaderboard - TypeSpeed Pro',
                leaderboard,
                globalStats,
                userRank,
                timeframe,
                user: req.user
            });
            
        } catch (error) {
            console.error('Get leaderboard page error:', error);
            res.status(500).render('error/500.njk', {
                title: 'Server Error - TypeSpeed Pro',
                message: 'Failed to load leaderboard'
            });
        }
    },
    
    // Get top performers
    getTopPerformers: async (req, res) => {
        try {
            const timeframe = req.query.timeframe || 'week';
            const limit = parseInt(req.query.limit) || 5;
            
            const topPerformers = await TestResult.getLeaderboard(timeframe, limit);
            
            res.json({
                success: true,
                data: {
                    topPerformers,
                    timeframe
                }
            });
            
        } catch (error) {
            console.error('Get top performers error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch top performers'
            });
        }
    },
    
    // Get leaderboard statistics
    getLeaderboardStats: async (req, res) => {
        try {
            const stats = await TestResult.getGlobalStats();
            
            res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('Get leaderboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard statistics'
            });
        }
    }
};

module.exports = leaderboardController;