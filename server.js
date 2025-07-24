require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import your existing files
const { pool, initializeDatabase } = require('./config/database');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const userRoutes = require('./routes/user');

const { requireAuth, optionalAuth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for accurate client IPs
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:", "https://api.typespeedpro.com"]
        }
    }
}));

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 1000,
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: NODE_ENV === 'production' ? 30 : 300,
    message: {
        error: 'Too many API requests, please slow down.'
    }
});

const testLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: NODE_ENV === 'production' ? 5 : 50,
    message: {
        error: 'Too many typing tests started, please wait before starting another.'
    }
});

app.use(limiter);

// Compression
app.use(compression());

// Logging
if (NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax'
    },
    name: 'typespeed.sid'
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: NODE_ENV === 'production' ? '1y' : '0',
    etag: true
}));

// Template engine setup
const nunjucksEnv = nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: NODE_ENV !== 'production',
    noCache: NODE_ENV !== 'production'
});




// Add custom filters and globals
nunjucksEnv.addGlobal('NODE_ENV', NODE_ENV);
nunjucksEnv.addGlobal('APP_VERSION', process.env.APP_VERSION || '1.0.0');
nunjucksEnv.addGlobal('CURRENT_YEAR', new Date().getFullYear());

nunjucksEnv.addFilter('date', function(date, format) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
});

nunjucksEnv.addFilter('number', function(num) {
    if (!num) return '0';
    return num.toLocaleString();
});

// Add user to locals for templates
app.use(optionalAuth);

// Socket.IO setup
const { setupSocket } = require('./config/socket');
setupSocket(io);

// Make io available to routes
app.set('io', io);

// API Routes
app.use('/api', apiLimiter, apiRoutes);
app.use('/api/test', testLimiter, testRoutes);
app.use('/api/user', userRoutes);

// Auth routes
app.use('/auth', authRoutes);

// Main application pages
app.get('/', optionalAuth, (req, res) => {
    res.render('pages/home.njk', {
        title: 'TypeSpeed Pro - Master Your Typing Skills',
        description: 'Improve your typing speed and accuracy with our professional typing test platform. Track progress, compete globally, and achieve typing excellence.',
        user: req.user,
        currentPage: 'home'
    });
});

// Typing test page
app.get('/test', optionalAuth, (req, res) => {
    res.render('pages/test.njk', {
        title: 'Typing Test - TypeSpeed Pro',
        description: 'Take a professional typing speed test. Measure your WPM and accuracy.',
        user: req.user,
        currentPage: 'test'
    });
});

// Custom typing test
app.get('/test/custom', requireAuth, (req, res) => {
    res.render('pages/custom-test.njk', {
        title: 'Custom Typing Test - TypeSpeed Pro',
        description: 'Create your own custom typing test with personalized content.',
        user: req.user,
        currentPage: 'test'
    });
});

// Results page
app.get('/results/:testId?', optionalAuth, (req, res) => {
    res.render('pages/results.njk', {
        title: 'Test Results - TypeSpeed Pro',
        description: 'View your typing test results and detailed analytics.',
        user: req.user,
        testId: req.params.testId,
        currentPage: 'results'
    });
});

// Profile and dashboard
app.get('/profile', requireAuth, (req, res) => {
    res.render('pages/profile.njk', {
        title: 'Profile - TypeSpeed Pro',
        description: 'View and manage your typing profile, statistics, and achievements.',
        user: req.user,
        currentPage: 'profile'
    });
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.render('pages/dashboard.njk', {
        title: 'Dashboard - TypeSpeed Pro',
        description: 'Your personal typing dashboard with progress tracking and insights.',
        user: req.user,
        currentPage: 'dashboard'
    });
});

// Leaderboard - using your existing leaderboardController
app.get('/leaderboard', optionalAuth, async (req, res) => {
    try {
        const leaderboardController = require('./controllers/leaderboardController');
        await leaderboardController.getLeaderboardPage(req, res);
    } catch (error) {
        console.error('Leaderboard page error:', error);
        res.render('pages/leaderboard.njk', {
            title: 'Leaderboard - TypeSpeed Pro',
            description: 'See the top typing speed champions and compete for the highest scores.',
            user: req.user,
            currentPage: 'leaderboard',
            error: 'Failed to load leaderboard'
        });
    }
});

// Practice and learning pages
app.get('/practice', optionalAuth, (req, res) => {
    res.render('pages/practice.njk', {
        title: 'Practice - TypeSpeed Pro',
        description: 'Structured typing practice exercises to improve your speed and accuracy.',
        user: req.user,
        currentPage: 'practice'
    });
});

app.get('/lessons', optionalAuth, (req, res) => {
    res.render('pages/lessons.njk', {
        title: 'Typing Lessons - TypeSpeed Pro',
        description: 'Learn touch typing with our comprehensive lesson system.',
        user: req.user,
        currentPage: 'lessons'
    });
});

app.get('/lessons/:lessonId', optionalAuth, (req, res) => {
    res.render('pages/lesson-detail.njk', {
        title: 'Typing Lesson - TypeSpeed Pro',
        description: 'Interactive typing lesson to improve your skills.',
        user: req.user,
        lessonId: req.params.lessonId,
        currentPage: 'lessons'
    });
});

// Educational content pages
app.get('/typing-tips', optionalAuth, (req, res) => {
    res.render('pages/typingtips.njk', {
        title: 'Typing Tips - TypeSpeed Pro',
        description: 'Expert tips and techniques to improve your typing speed and accuracy.',
        user: req.user,
        currentPage: 'tips'
    });
});

app.get('/keyboard-guide', optionalAuth, (req, res) => {
    res.render('pages/keyboardguide.njk', {
        title: 'Keyboard Guide - TypeSpeed Pro',
        description: 'Complete guide to keyboard layouts and proper finger positioning.',
        user: req.user,
        currentPage: 'guide'
    });
});

app.get('/practice-exercises', optionalAuth, (req, res) => {
    res.render('pages/practiceexercises.njk', {
        title: 'Practice Exercises - TypeSpeed Pro',
        description: 'Targeted exercises to improve specific aspects of your typing.',
        user: req.user,
        currentPage: 'exercises'
    });
});

app.get('/speed-goals', optionalAuth, (req, res) => {
    res.render('pages/speedgoals.njk', {
        title: 'Speed Goals - TypeSpeed Pro',
        description: 'Set and track your typing speed goals and milestones.',
        user: req.user,
        currentPage: 'goals'
    });
});

// Competition and community
app.get('/competitions', optionalAuth, (req, res) => {
    res.render('pages/competitions.njk', {
        title: 'Competitions - TypeSpeed Pro',
        description: 'Join typing competitions and challenges with other users.',
        user: req.user,
        currentPage: 'competitions'
    });
});

app.get('/achievements', optionalAuth, (req, res) => {
    res.render('pages/achievements.njk', {
        title: 'Achievements - TypeSpeed Pro',
        description: 'Unlock achievements and earn badges for your typing milestones.',
        user: req.user,
        currentPage: 'achievements'
    });
});

// Premium and pricing
app.get('/premium', optionalAuth, (req, res) => {
    res.render('pages/premium.njk', {
        title: 'Premium Features - TypeSpeed Pro',
        description: 'Unlock advanced features with TypeSpeed Pro Premium subscription.',
        user: req.user,
        currentPage: 'premium'
    });
});

app.get('/pricing', optionalAuth, (req, res) => {
    res.render('pages/pricing.njk', {
        title: 'Pricing - TypeSpeed Pro',
        description: 'Choose the perfect plan for your typing improvement journey.',
        user: req.user,
        currentPage: 'pricing'
    });
});

// Settings and account management
app.get('/settings', requireAuth, (req, res) => {
    res.render('pages/settings.njk', {
        title: 'Settings - TypeSpeed Pro',
        description: 'Customize your typing experience and account preferences.',
        user: req.user,
        currentPage: 'settings'
    });
});

// Company and legal pages
app.get('/about', optionalAuth, (req, res) => {
    res.render('pages/about.njk', {
        title: 'About Us - TypeSpeed Pro',
        description: 'Learn about TypeSpeed Pro and our mission to improve typing skills worldwide.',
        user: req.user,
        currentPage: 'about'
    });
});

app.get('/contact', optionalAuth, (req, res) => {
    res.render('pages/contact.njk', {
        title: 'Contact Us - TypeSpeed Pro',
        description: 'Get in touch with the TypeSpeed Pro team for support and inquiries.',
        user: req.user,
        currentPage: 'contact'
    });
});

app.get('/support', optionalAuth, (req, res) => {
    res.render('pages/support.njk', {
        title: 'Support - TypeSpeed Pro',
        description: 'Find help and support for using TypeSpeed Pro effectively.',
        user: req.user,
        currentPage: 'support'
    });
});

app.get('/help', optionalAuth, (req, res) => {
    res.render('pages/help.njk', {
        title: 'Help Center - TypeSpeed Pro',
        description: 'Comprehensive help center with guides and tutorials.',
        user: req.user,
        currentPage: 'help'
    });
});

app.get('/faq', optionalAuth, (req, res) => {
    res.render('pages/faq.njk', {
        title: 'FAQs - TypeSpeed Pro',
        description: 'Frequently asked questions about TypeSpeed Pro and typing improvement.',
        user: req.user,
        currentPage: 'faq'
    });
});

app.get('/keyboardguide', optionalAuth, (req, res) => {
    res.render('pages/keyboardguide.njk', {
        title: 'Keyboard Guide - TypeSpeed Pro',
        description: 'Complete guide to keyboard layouts and proper finger positioning.',
        user: req.user,
        currentPage: 'guide'
    });
});

app.get('/practiceexercises', optionalAuth, (req, res) => {
    res.render('pages/practiceexercises.njk', {
        title: 'Practice Exercises - TypeSpeed Pro',
        description: 'Improve your typing skills with our curated practice exercises.',
        user: req.user,
        currentPage: 'practice'
    });
});

app.get('/speedgoals', optionalAuth, (req, res) => {
    res.render('pages/speedgoals.njk', {    
        title: 'Speed Goals - TypeSpeed Pro',
        description: 'Set and track your typing speed goals with TypeSpeed Pro.',
        user: req.user,
        currentPage: 'goals'
    });
});


app.get('/typingtips', optionalAuth, (req, res) => {
    res.render('pages/typingtips.njk', {
        title: 'Typing Tips - TypeSpeed Pro',
        description: 'Expert tips and techniques to improve your typing speed and accuracy.',
        user: req.user,
        currentPage: 'tips'
    });
});


// Legal pages
app.get('/privacy', optionalAuth, (req, res) => {
    res.render('pages/privacy.njk', {
        title: 'Privacy Policy - TypeSpeed Pro',
        description: 'Our commitment to protecting your privacy and personal data.',
        user: req.user,
        currentPage: 'legal'
    });
});

app.get('/terms', optionalAuth, (req, res) => {
    res.render('pages/terms.njk', {
        title: 'Terms of Service - TypeSpeed Pro',
        description: 'Terms and conditions for using TypeSpeed Pro services.',
        user: req.user,
        currentPage: 'legal'
    });
});

app.get('/cookies', optionalAuth, (req, res) => {
    res.render('pages/cookie.njk', {
        title: 'Cookie Policy - TypeSpeed Pro',
        description: 'How we use cookies to improve your experience on TypeSpeed Pro.',
        user: req.user,
        currentPage: 'legal'
    });
});

// Blog/News section
app.get('/blog', optionalAuth, (req, res) => {
    res.render('pages/blog.njk', {
        title: 'Blog - TypeSpeed Pro',
        description: 'Latest news, tips, and insights about typing and productivity.',
        user: req.user,
        currentPage: 'blog'
    });
});

app.get('/blog/:slug', optionalAuth, (req, res) => {
    res.render('pages/blog-post.njk', {
        title: 'Blog Post - TypeSpeed Pro',
        description: 'Read our latest blog post about typing and productivity.',
        user: req.user,
        slug: req.params.slug,
        currentPage: 'blog'
    });
});

// Sitemap and robots
app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'), (err) => {
        if (err) {
            res.status(404).send('Sitemap not found');
        }
    });
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'), (err) => {
        if (err) {
            res.status(404).send('Robots.txt not found');
        }
    });
});

// Health check and monitoring
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: NODE_ENV,
        database: 'PostgreSQL connected'
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Legacy route redirects
app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    const redirectMap = {
        'typingtips': '/typing-tips',
        'keyboardguide': '/keyboard-guide',
        'practiceexercises': '/practice-exercises',
        'speedgoals': '/speed-goals',
        'faq': '/faq',
        'privacy': '/privacy',
        'terms': '/terms',
        'cookie': '/cookies',
        'contact': '/contact',
        'support': '/support'
    };
    
    if (redirectMap[page]) {
        return res.redirect(301, redirectMap[page]);
    }
    
    res.redirect('/');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database initialized successfully');
        
        // Start server
        server.listen(PORT, () => {
            console.log('🚀 TypeSpeed Pro Server Started');
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`📱 Environment: ${NODE_ENV}`);
            console.log(`🔐 Authentication: Session-based`);
            console.log(`🛡️  Security: Helmet enabled`);
            console.log(`⚡ Compression: Enabled`);
            console.log(`📊 Rate Limiting: Enabled`);
            console.log(`🗄️  Session Store: PostgreSQL`);
            console.log(`🐘 Database: PostgreSQL with connection pooling`);
            console.log(`🎨 Template Engine: Nunjucks`);
            console.log(`📝 Logging: ${NODE_ENV === 'production' ? 'Combined' : 'Dev'}`);
            console.log(`🔌 Socket.IO: Enabled`);
            console.log('✅ Ready to accept connections');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully');
    server.close(() => {
        pool.end(() => {
            console.log('🐘 Database pool closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully');
    server.close(() => {
        pool.end(() => {
            console.log('🐘 Database pool closed');
            process.exit(0);
        });
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();

module.exports = { app, server, io };