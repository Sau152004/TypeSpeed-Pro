require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Database and configuration
const { pool } = require('./config/database');
require('./config/auth');

// Route imports
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const testRoutes = require('./routes/test');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const achievementRoutes = require('./routes/achievements');
const leaderboardRoutes = require('./routes/leaderboard');
const practiceRoutes = require('./routes/practice');
const lessonRoutes = require('./routes/lessons');
const competitionRoutes = require('./routes/competitions');
const blogRoutes = require('./routes/blog');

// Middleware imports
const { requireAuth, optionalAuth, requireAdmin } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeInput, validateInput } = require('./middleware/validation');
const { logActivity } = require('./middleware/logging');
const { cacheMiddleware } = require('./middleware/cache');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for accurate client IPs (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:", "https://api.typespeedpro.com"],
            mediaSrc: ["'self'", "data:", "blob:"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false, // Allow embedded content for typing tests
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Compression and CORS
app.use(compression({
    level: NODE_ENV === 'production' ? 6 : 1,
    threshold: 1000
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}));

// Logging middleware
if (NODE_ENV === 'production') {
    app.use(morgan('combined', {
        stream: fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' })
    }));
} else {
    app.use(morgan('dev'));
}

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: message });
    }
});

// General rate limiting
const generalLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    NODE_ENV === 'production' ? 100 : 1000,
    'Too many requests from this IP, please try again later.'
);

// API rate limiting
const apiLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    NODE_ENV === 'production' ? 50 : 500,
    'Too many API requests, please try again later.'
);

// Test submission rate limiting
const testLimiter = createRateLimiter(
    60 * 1000, // 1 minute
    NODE_ENV === 'production' ? 5 : 50,
    'Too many typing tests started, please wait before starting another.'
);

// Auth rate limiting
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts, please try again later.'
);

// Apply rate limiting
app.use(generalLimiter);
app.use('/api/', apiLimiter);
app.use('/api/test/save', testLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 1000
}));

// Input sanitization
app.use(sanitizeInput);

// Session configuration with PostgreSQL store
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        schemaName: 'public'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
        secure: NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax'
    },
    name: 'typespeed.sid'
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Activity logging middleware
app.use(logActivity);

// Static files with advanced caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: NODE_ENV === 'production' ? '1y' : '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', NODE_ENV === 'production' ? 'public, max-age=3600' : 'no-cache');
        }
    }
}));

// Template engine setup with enhanced configuration
const env = nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: NODE_ENV !== 'production',
    noCache: NODE_ENV !== 'production',
    throwOnUndefined: NODE_ENV !== 'production'
});

// Add global template functions
env.addGlobal('formatDate', (date, format = 'short') => {
    if (!date) return '';
    const d = new Date(date);
    const options = {
        short: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
        time: { hour: '2-digit', minute: '2-digit' },
        datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    };
    return d.toLocaleDateString('en-US', options[format] || options.short);
});

env.addGlobal('formatTime', (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
});

env.addGlobal('formatNumber', (num, options = {}) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: options.decimals || 0,
        maximumFractionDigits: options.decimals || 0
    });
});

env.addGlobal('formatDuration', (seconds) => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
});

env.addGlobal('calculateWPM', (characters, timeInSeconds) => {
    if (!characters || !timeInSeconds) return 0;
    return Math.round((characters / 5) / (timeInSeconds / 60));
});

env.addGlobal('getAccuracyColor', (accuracy) => {
    if (accuracy >= 95) return 'text-green-600';
    if (accuracy >= 90) return 'text-yellow-600';
    if (accuracy >= 80) return 'text-orange-600';
    return 'text-red-600';
});

env.addGlobal('getSpeedLevel', (wpm) => {
    if (wpm >= 80) return 'Expert';
    if (wpm >= 60) return 'Advanced';
    if (wpm >= 40) return 'Intermediate';
    if (wpm >= 20) return 'Beginner';
    return 'Novice';
});

// Add template filters
env.addFilter('truncate', (str, length = 100) => {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
});

env.addFilter('capitalize', (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
});

env.addFilter('pluralize', (count, singular, plural) => {
    return count === 1 ? singular : (plural || singular + 's');
});

// Add global template variables
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.isAuthenticated = !!req.user;
    res.locals.currentPage = req.path.split('/')[1] || 'home';
    res.locals.currentPath = req.path;
    res.locals.theme = req.user?.settings?.theme || 'system';
    res.locals.isProduction = NODE_ENV === 'production';
    res.locals.isDevelopment = NODE_ENV !== 'production';
    res.locals.currentYear = new Date().getFullYear();
    res.locals.siteTitle = 'TypeSpeed Pro';
    res.locals.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    res.locals.appVersion = process.env.APP_VERSION || '1.0.0';
    res.locals.supportEmail = process.env.SUPPORT_EMAIL || 'support@typespeedpro.com';
    next();
});

// API Routes
app.use('/api', apiRoutes);
app.use('/api/test', testRoutes);
app.use('/api/user', userRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/competitions', competitionRoutes);

// Authentication routes
app.use('/auth', authRoutes);

// Admin routes (protected)
app.use('/admin', requireAdmin, adminRoutes);

// Blog routes
app.use('/blog', blogRoutes);

// Main application pages
app.get('/', optionalAuth, cacheMiddleware(300), (req, res) => {
    res.render('pages/home.njk', {
        title: 'TypeSpeed Pro - Master Your Typing Skills',
        description: 'Improve your typing speed and accuracy with our professional typing test platform. Track progress, compete globally, and achieve typing excellence.',
        currentPage: 'home',
        canonicalUrl: '/',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            'name': 'TypeSpeed Pro',
            'description': 'Professional typing test and training platform',
            'url': res.locals.siteUrl,
            'applicationCategory': 'EducationalApplication'
        }
    });
});

// Typing test pages
app.get('/test', optionalAuth, (req, res) => {
    res.render('pages/test.njk', {
        title: 'Typing Test - TypeSpeed Pro',
        description: 'Take a professional typing speed test. Measure your WPM, accuracy, and improve your typing skills.',
        currentPage: 'test',
        canonicalUrl: '/test'
    });
});

app.get('/test/custom', requireAuth, (req, res) => {
    res.render('pages/custom-test.njk', {
        title: 'Custom Typing Test - TypeSpeed Pro',
        description: 'Create your own custom typing test with personalized content and settings.',
        currentPage: 'test',
        canonicalUrl: '/test/custom'
    });
});

// Results and analytics
app.get('/results/:testId?', optionalAuth, async (req, res) => {
    try {
        let testResult = null;
        if (req.params.testId) {
            const TestResult = require('./models/TestResult');
            testResult = await TestResult.getById(req.params.testId, req.user?.id);
        }
        
        res.render('pages/results.njk', {
            title: 'Test Results - TypeSpeed Pro',
            description: 'View detailed typing test results and performance analytics.',
            currentPage: 'results',
            testResult,
            canonicalUrl: `/results${req.params.testId ? '/' + req.params.testId : ''}`
        });
    } catch (error) {
        console.error('Results page error:', error);
        res.redirect('/test');
    }
});

// User dashboard and profile
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const TestResult = require('./models/TestResult');
        const Achievement = require('./models/Achievement');
        
        const [recentTests, userStats, achievements] = await Promise.all([
            TestResult.getUserRecent(req.user.id, 10),
            TestResult.getUserStats(req.user.id),
            Achievement.getUserAchievements(req.user.id)
        ]);
        
        res.render('pages/dashboard.njk', {
            title: 'Dashboard - TypeSpeed Pro',
            description: 'Your personal typing dashboard with progress tracking and insights.',
            currentPage: 'dashboard',
            recentTests,
            userStats,
            achievements,
            canonicalUrl: '/dashboard'
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('pages/dashboard.njk', {
            title: 'Dashboard - TypeSpeed Pro',
            currentPage: 'dashboard',
            error: 'Failed to load dashboard data'
        });
    }
});

app.get('/profile', requireAuth, async (req, res) => {
    try {
        const TestResult = require('./models/TestResult');
        const userStats = await TestResult.getUserStats(req.user.id);
        
        res.render('pages/profile.njk', {
            title: 'Profile - TypeSpeed Pro',
            description: 'Manage your typing profile, view statistics, and track your progress.',
            currentPage: 'profile',
            userStats,
            canonicalUrl: '/profile'
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.render('pages/profile.njk', {
            title: 'Profile - TypeSpeed Pro',
            currentPage: 'profile',
            error: 'Failed to load profile data'
        });
    }
});

// Leaderboard
app.get('/leaderboard', optionalAuth, cacheMiddleware(300), async (req, res) => {
    try {
        const TestResult = require('./models/TestResult');
        const timeframe = req.query.timeframe || 'all';
        const category = req.query.category || 'speed';
        
        const [leaderboard, globalStats, userRank] = await Promise.all([
            TestResult.getLeaderboard(timeframe, category, 50),
            TestResult.getGlobalStats(),
            req.user ? TestResult.getUserRank(req.user.id, timeframe, category) : null
        ]);
        
        res.render('pages/leaderboard.njk', {
            title: 'Leaderboard - TypeSpeed Pro',
            description: 'See the top typing speed champions and compete for the highest scores worldwide.',
            currentPage: 'leaderboard',
            leaderboard: {
                entries: leaderboard,
                timeframe,
                category
            },
            globalStats,
            userRank,
            canonicalUrl: '/leaderboard'
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.render('pages/leaderboard.njk', {
            title: 'Leaderboard - TypeSpeed Pro',
            currentPage: 'leaderboard',
            leaderboard: { entries: [], timeframe: 'all', category: 'speed' },
            globalStats: {},
            error: 'Failed to load leaderboard'
        });
    }
});

// Practice and learning
app.get('/practice', optionalAuth, (req, res) => {
    res.render('pages/practice.njk', {
        title: 'Practice Exercises - TypeSpeed Pro',
        description: 'Structured typing practice exercises to improve your speed and accuracy.',
        currentPage: 'practice',
        canonicalUrl: '/practice'
    });
});

app.get('/lessons', optionalAuth, async (req, res) => {
    try {
        const Lesson = require('./models/Lesson');
        const lessons = await Lesson.getAll();
        
        res.render('pages/lessons.njk', {
            title: 'Typing Lessons - TypeSpeed Pro',
            description: 'Learn touch typing with our comprehensive lesson system from beginner to advanced.',
            currentPage: 'lessons',
            lessons,
            canonicalUrl: '/lessons'
        });
    } catch (error) {
        console.error('Lessons error:', error);
        res.render('pages/lessons.njk', {
            title: 'Typing Lessons - TypeSpeed Pro',
            currentPage: 'lessons',
            lessons: [],
            error: 'Failed to load lessons'
        });
    }
});

app.get('/lessons/:lessonId', optionalAuth, async (req, res) => {
    try {
        const Lesson = require('./models/Lesson');
        const lesson = await Lesson.getById(req.params.lessonId);
        
        if (!lesson) {
            return res.status(404).render('pages/error.njk', {
                title: 'Lesson Not Found - TypeSpeed Pro',
                error: { status: 404, message: 'Lesson not found' }
            });
        }
        
        res.render('pages/lesson-detail.njk', {
            title: `${lesson.title} - Typing Lessons - TypeSpeed Pro`,
            description: lesson.description,
            currentPage: 'lessons',
            lesson,
            canonicalUrl: `/lessons/${req.params.lessonId}`
        });
    } catch (error) {
        console.error('Lesson detail error:', error);
        res.redirect('/lessons');
    }
});

// Achievements and competitions
app.get('/achievements', optionalAuth, async (req, res) => {
    try {
        const Achievement = require('./models/Achievement');
        const achievements = await Achievement.getAll();
        const userAchievements = req.user ? await Achievement.getUserAchievements(req.user.id) : [];
        
        res.render('pages/achievements.njk', {
            title: 'Achievements - TypeSpeed Pro',
            description: 'Unlock achievements and earn badges for your typing milestones and accomplishments.',
            currentPage: 'achievements',
            achievements,
            userAchievements,
            canonicalUrl: '/achievements'
        });
    } catch (error) {
        console.error('Achievements error:', error);
        res.render('pages/achievements.njk', {
            title: 'Achievements - TypeSpeed Pro',
            currentPage: 'achievements',
            achievements: [],
            userAchievements: [],
            error: 'Failed to load achievements'
        });
    }
});

app.get('/competitions', optionalAuth, async (req, res) => {
    try {
        const Competition = require('./models/Competition');
        const [activeCompetitions, upcomingCompetitions, pastCompetitions] = await Promise.all([
            Competition.getActive(),
            Competition.getUpcoming(),
            Competition.getPast(5)
        ]);
        
        res.render('pages/competitions.njk', {
            title: 'Competitions - TypeSpeed Pro',
            description: 'Join typing competitions and challenges with players from around the world.',
            currentPage: 'competitions',
            activeCompetitions,
            upcomingCompetitions,
            pastCompetitions,
            canonicalUrl: '/competitions'
        });
    } catch (error) {
        console.error('Competitions error:', error);
        res.render('pages/competitions.njk', {
            title: 'Competitions - TypeSpeed Pro',
            currentPage: 'competitions',
            activeCompetitions: [],
            upcomingCompetitions: [],
            pastCompetitions: [],
            error: 'Failed to load competitions'
        });
    }
});

// Educational content
app.get('/typing-tips', optionalAuth, cacheMiddleware(3600), (req, res) => {
    res.render('pages/typingtips.njk', {
        title: 'Typing Tips - TypeSpeed Pro',
        description: 'Expert tips and techniques to improve your typing speed, accuracy, and technique.',
        currentPage: 'tips',
        canonicalUrl: '/typing-tips'
    });
});

app.get('/keyboard-guide', optionalAuth, cacheMiddleware(3600), (req, res) => {
    res.render('pages/keyboardguide.njk', {
        title: 'Keyboard Guide - TypeSpeed Pro',
        description: 'Complete guide to keyboard layouts, proper finger positioning, and touch typing fundamentals.',
        currentPage: 'guide',
        canonicalUrl: '/keyboard-guide'
    });
});

app.get('/practice-exercises', optionalAuth, cacheMiddleware(3600), (req, res) => {
    res.render('pages/practiceexercises.njk', {
        title: 'Practice Exercises - TypeSpeed Pro',
        description: 'Targeted typing exercises to improve specific aspects of your typing skills.',
        currentPage: 'exercises',
        canonicalUrl: '/practice-exercises'
    });
});

app.get('/speed-goals', optionalAuth, cacheMiddleware(3600), (req, res) => {
    res.render('pages/speedgoals.njk', {
        title: 'Speed Goals - TypeSpeed Pro',
        description: 'Set and track your typing speed goals with our milestone tracking system.',
        currentPage: 'goals',
        canonicalUrl: '/speed-goals'
    });
});

// Premium and pricing
app.get('/premium', optionalAuth, (req, res) => {
    res.render('pages/premium.njk', {
        title: 'Premium Features - TypeSpeed Pro',
        description: 'Unlock advanced features and detailed analytics with TypeSpeed Pro Premium.',
        currentPage: 'premium',
        canonicalUrl: '/premium'
    });
});

app.get('/pricing', optionalAuth, (req, res) => {
    res.render('pages/pricing.njk', {
        title: 'Pricing - TypeSpeed Pro',
        description: 'Choose the perfect plan for your typing improvement journey.',
        currentPage: 'pricing',
        canonicalUrl: '/pricing'
    });
});

// Settings and account management
app.get('/settings', requireAuth, (req, res) => {
    res.render('pages/settings.njk', {
        title: 'Settings - TypeSpeed Pro',
        description: 'Customize your typing experience and manage your account preferences.',
        currentPage: 'settings',
        canonicalUrl: '/settings'
    });
});

// Company and informational pages
app.get('/about', optionalAuth, cacheMiddleware(3600), (req, res) => {
    res.render('pages/about.njk', {
        title: 'About Us - TypeSpeed Pro',
        description: 'Learn about TypeSpeed Pro and our mission to help people improve their typing skills worldwide.',
        currentPage: 'about',
        canonicalUrl: '/about'
    });
});

app.get('/contact', optionalAuth, (req, res) => {
    res.render('pages/contact.njk', {
        title: 'Contact Us - TypeSpeed Pro',
        description: 'Get in touch with the TypeSpeed Pro team for support, feedback, and inquiries.',
        currentPage: 'contact',
        canonicalUrl: '/contact'
    });
});

app.get('/support', optionalAuth, cacheMiddleware(1800), (req, res) => {
    res.render('pages/support.njk', {
        title: 'Support - TypeSpeed Pro',
        description: 'Find help and support for using TypeSpeed Pro effectively.',
        currentPage: 'support',
        canonicalUrl: '/support'
    });
});

app.get('/help', optionalAuth, cacheMiddleware(1800), (req, res) => {
    res.render('pages/help.njk', {
        title: 'Help Center - TypeSpeed Pro',
        description: 'Comprehensive help center with guides, tutorials, and frequently asked questions.',
        currentPage: 'help',
        canonicalUrl: '/help'
    });
});

app.get('/faqs', optionalAuth, cacheMiddleware(3600), (req, res) => {
    res.render('pages/faqs.njk', {
        title: 'FAQs - TypeSpeed Pro',
        description: 'Frequently asked questions about TypeSpeed Pro and typing improvement.',
        currentPage: 'faqs',
        canonicalUrl: '/faqs'
    });
});

// Legal pages
app.get('/privacy', optionalAuth, cacheMiddleware(86400), (req, res) => {
    res.render('pages/privacy.njk', {
        title: 'Privacy Policy - TypeSpeed Pro',
        description: 'Our commitment to protecting your privacy and personal data.',
        currentPage: 'legal',
        canonicalUrl: '/privacy'
    });
});

app.get('/terms', optionalAuth, cacheMiddleware(86400), (req, res) => {
    res.render('pages/terms.njk', {
        title: 'Terms of Service - TypeSpeed Pro',
        description: 'Terms and conditions for using TypeSpeed Pro services.',
        currentPage: 'legal',
        canonicalUrl: '/terms'
    });
});

app.get('/cookies', optionalAuth, cacheMiddleware(86400), (req, res) => {
    res.render('pages/cookie.njk', {
        title: 'Cookie Policy - TypeSpeed Pro',
        description: 'How we use cookies to improve your experience on TypeSpeed Pro.',
        currentPage: 'legal',
        canonicalUrl: '/cookies'
    });
});

// API endpoints
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: NODE_ENV,
        database: 'connected' // Add actual DB health check
    });
});

app.get('/api/stats/footer', cacheMiddleware(300), async (req, res) => {
    try {
        const TestResult = require('./models/TestResult');
        const { getOnlineUserCount } = require('./config/socket');
        
        const stats = await TestResult.getGlobalStats();
        const onlineUsers = getOnlineUserCount();
        
        res.json({
            success: true,
            data: {
                onlineUsers: onlineUsers || 0,
                dailyTests: stats.daily_tests || 0,
                totalUsers: stats.total_users || 0,
                avgWpmToday: stats.avg_wpm_today || 0,
                testsThisMonth: stats.tests_this_month || 0
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
                avgWpmToday: 0,
                testsThisMonth: 0
            }
        });
    }
});

// Sitemap and robots
app.get('/sitemap.xml', cacheMiddleware(86400), (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.get('/robots.txt', cacheMiddleware(86400), (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// Legacy route redirects
app.get('/pages/:page', (req, res) => {
    const redirectMap = {
        'typingtips': '/typing-tips',
        'keyboardguide': '/keyboard-guide',
        'practiceexercises': '/practice-exercises',
        'speedgoals': '/speed-goals',
        'faqs': '/faqs',
        'privacy': '/privacy',
        'terms': '/terms',
        'cookie': '/cookies',
        'contact': '/contact',
        'support': '/support'
    };
    
    const redirect = redirectMap[req.params.page];
    if (redirect) {
        return res.redirect(301, redirect);
    }
    
    res.redirect('/');
});

// Admin panel
app.get('/admin', requireAdmin, (req, res) => {
    res.render('admin/dashboard.njk', {
        title: 'Admin Dashboard - TypeSpeed Pro',
        currentPage: 'admin',
        layout: 'admin/layout.njk'
    });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    
    // Close database connections
    pool.end(() => {
        console.log('Database connections closed');
    });
    
    // Exit process
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    if (NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;