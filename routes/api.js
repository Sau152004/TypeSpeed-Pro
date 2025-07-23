const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const apiController = require('../controllers/apiController');

const router = express.Router();

// Test result routes
router.post('/test/save', requireAuth, apiController.saveTestResult);
router.get('/test/history', requireAuth, apiController.getTestHistory);

// User routes
router.get('/user/stats', requireAuth, apiController.getUserStats);

// Leaderboard (public)
router.get('/leaderboard', apiController.getLeaderboard);

// Text generation routes (keep existing ones from server.js)
router.get('/text/random', (req, res) => {
    const commonWords = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
        'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say',
        'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
        'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
        'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
        'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work'
    ];
    
    const duration = parseInt(req.query.duration) || 15;
    const wordsNeeded = Math.max(Math.ceil(duration * 2), 20);
    
    const words = [];
    for (let i = 0; i < wordsNeeded; i++) {
        words.push(commonWords[Math.floor(Math.random() * commonWords.length)]);
    }
    
    res.json({
        success: true,
        text: words.join(' ')
    });
});

router.get('/text/words', (req, res) => {
    const commonWords = [
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
        'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say'
    ];
    
    const count = parseInt(req.query.count) || 50;
    const words = [];
    for (let i = 0; i < count; i++) {
        words.push(commonWords[Math.floor(Math.random() * commonWords.length)]);
    }
    
    res.json({
        success: true,
        text: words.join(' ')
    });
});

router.get('/text/quote', (req, res) => {
    const quotes = [
        "The quick brown fox jumps over the lazy dog.",
        "To be or not to be, that is the question.",
        "It was the best of times, it was the worst of times.",
        "Programming is not about typing, it is about thinking.",
        "The best time to plant a tree was 20 years ago. The second best time is now.",
        "Code is like humor. When you have to explain it, it's bad."
    ];
    
    res.json({
        success: true,
        text: quotes[Math.floor(Math.random() * quotes.length)]
    });
});

module.exports = router;