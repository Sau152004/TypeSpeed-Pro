const express = require('express');
const nunjucks = require('nunjucks');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { pool } = require('./config/database');
require('./config/auth');

// Route imports
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const testRoutes = require('./routes/test');
const userRoutes = require('./routes/user');

// Middleware imports
const { requireAuth, optionalAuth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

app.use(compression());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// API rate limiting (more restrictive)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many API requests, please try again later.'
    }
});

app.use('/api/test/save', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    name: 'typespeed.sid'
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Template engine setup
const env = nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: process.env.NODE_ENV !== 'production'
});

// Add global template functions
env.addGlobal('formatDate', (date) => {
    return new Date(date).toLocaleDateString();
});

env.addGlobal('formatTime', (date) => {
    return new Date(date).toLocaleTimeString();
});

env.addGlobal('formatNumber', (num) => {
    return Number(num).toLocaleString();
});

// Add global template variables
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.currentPage = req.path.split('/')[1] || 'home';
    res.locals.theme = req.user?.settings?.theme || 'light';
    res.locals.isProduction = process.env.NODE_ENV === 'production';
    res.locals.currentYear = new Date().getFullYear();
    res.locals.siteTitle = 'TypeSpeed Pro';
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/test', testRoutes);
app.use('/api/user', userRoutes);

// Main pages
app.get('/', optionalAuth, (req, res) => {
    res.render('pages/home.njk', {
        title: 'TypeSpeed Pro - Professional Typing Test',
        currentPage: 'home'
    });
});

app.get('/leaderboard', optionalAuth, async (req, res) => {
    try {
        const TestResult = require('./models/TestResult');
        const timeframe = req.query.timeframe || 'all';
        const leaderboard = await TestResult.getLeaderboard(timeframe, 10);
        const globalStats = await TestResult.getGlobalStats();
        
        res.render('pages/leaderboard.njk', {
            title: 'Leaderboard - TypeSpeed Pro',
            currentPage: 'leaderboard',
            leaderboard,
            globalStats,
            timeframe
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.render('pages/leaderboard.njk', {
            title: 'Leaderboard - TypeSpeed Pro',
            currentPage: 'leaderboard',
            leaderboard: [],
            globalStats: {},
            error: 'Failed to load leaderboard'
        });
    }
});

app.get('/profile', requireAuth, (req, res) => {
    res.render('pages/profile.njk', {
        title: 'Profile - TypeSpeed Pro',
        currentPage: 'profile'
    });
});

app.get('/about', optionalAuth, (req, res) => {
    res.render('pages/about.njk', {
        title: 'About - TypeSpeed Pro',
        currentPage: 'about'
    });
});

// Settings page
app.get('/settings', requireAuth, (req, res) => {
    res.render('pages/settings.njk', {
        title: 'Settings - TypeSpeed Pro',
        currentPage: 'settings'
    });
});

// API health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API footer stats
app.get('/api/stats/footer', async (req, res) => {
    try {
        const TestResult = require('./models/TestResult');
        const { getOnlineUserCount } = require('./config/socket');
        
        const stats = await TestResult.getGlobalStats();
        const onlineUsers = getOnlineUserCount();
        
        res.json({
            success: true,
            data: {
                onlineUsers,
                dailyTests: stats.daily_tests || 0,
                totalUsers: stats.total_users || 0,
                avgWpmToday: stats.avg_wpm_today || 0
            }
        });
    } catch (error) {
        console.error('Footer stats error:', error);
        res.json({
            success: false,
            data: {
                onlineUsers: 0,
                dailyTests: 0,
                totalUsers: 0,
                avgWpmToday: 0
            }
        });
    }
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;