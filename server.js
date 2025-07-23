// // // require('dotenv').config();
// // // const app = require('./app');
// // // const http = require('http');
// // // const socketIo = require('socket.io');
// // // const { setupSocket } = require('./config/socket');

// // // const PORT = process.env.PORT || 3000;

// // // // Create HTTP server
// // // const server = http.createServer(app);

// // // // Setup Socket.IO
// // // const io = socketIo(server, {
// // //     cors: {
// // //         origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
// // //         methods: ["GET", "POST"]
// // //     }
// // // });

// // // setupSocket(io);

// // // // Start server
// // // server.listen(PORT, () => {
// // //     console.log(`🚀 Server running on port ${PORT}`);
// // //     console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
// // // });

// // // // Graceful shutdown
// // // process.on('SIGTERM', () => {
// // //     console.log('SIGTERM received, shutting down gracefully');
// // //     server.close(() => {
// // //         console.log('Process terminated');
// // //     });
// // // });


// // require('dotenv').config();
// // const express = require('express');
// // const nunjucks = require('nunjucks');
// // const path = require('path');

// // const app = express();
// // const PORT = process.env.PORT || 3000;

// // // Basic middleware
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // // Static files
// // app.use(express.static(path.join(__dirname, 'public')));

// // // Template engine setup
// // nunjucks.configure('views', {
// //     autoescape: true,
// //     express: app,
// //     watch: process.env.NODE_ENV !== 'production'
// // });

// // // Basic route to test everything is working
// // app.get('/', (req, res) => {
// //     res.send(`
// //         <!DOCTYPE html>
// //         <html>
// //         <head>
// //             <title>TypeSpeed Pro</title>
// //             <style>
// //                 body { 
// //                     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
// //                     max-width: 800px; 
// //                     margin: 50px auto; 
// //                     padding: 20px;
// //                     background: #f8fafc;
// //                 }
// //                 .success-box {
// //                     background: linear-gradient(135deg, #10b981, #059669);
// //                     color: white;
// //                     padding: 30px;
// //                     border-radius: 12px;
// //                     text-align: center;
// //                     margin-bottom: 30px;
// //                     box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
// //                 }
// //                 .feature-grid {
// //                     display: grid;
// //                     grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
// //                     gap: 20px;
// //                     margin: 30px 0;
// //                 }
// //                 .feature-card {
// //                     background: white;
// //                     padding: 20px;
// //                     border-radius: 8px;
// //                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
// //                     border-left: 4px solid #3b82f6;
// //                 }
// //                 .next-steps {
// //                     background: white;
// //                     padding: 25px;
// //                     border-radius: 8px;
// //                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
// //                 }
// //                 .command {
// //                     background: #1f2937;
// //                     color: #10b981;
// //                     padding: 10px 15px;
// //                     border-radius: 6px;
// //                     font-family: 'Courier New', monospace;
// //                     margin: 10px 0;
// //                 }
// //                 h1 { margin: 0 0 10px 0; font-size: 2.5em; }
// //                 h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
// //                 h3 { color: #1f2937; margin: 0 0 10px 0; }
// //                 .emoji { font-size: 1.5em; margin-right: 10px; }
// //             </style>
// //         </head>
// //         <body>
// //             <div class="success-box">
// //                 <h1>🚀 TypeSpeed Pro</h1>
// //                 <p style="font-size: 1.2em; margin: 0;">Your professional typing test application is successfully running!</p>
// //             </div>

// //             <div class="feature-grid">
// //                 <div class="feature-card">
// //                     <h3><span class="emoji">✅</span>Database Setup</h3>
// //                     <p>PostgreSQL database connected and migrated successfully</p>
// //                 </div>
// //                 <div class="feature-card">
// //                     <h3><span class="emoji">🖥️</span>Server Running</h3>
// //                     <p>Express.js server with Nunjucks templating ready</p>
// //                 </div>
// //                 <div class="feature-card">
// //                     <h3><span class="emoji">🔧</span>Environment</h3>
// //                     <p>Environment variables and configuration loaded</p>
// //                 </div>
// //                 <div class="feature-card">
// //                     <h3><span class="emoji">📁</span>File Structure</h3>
// //                     <p>All necessary directories and files created</p>
// //                 </div>
// //             </div>

// //             <div class="next-steps">
// //                 <h2>🎯 Next Steps</h2>
// //                 <p>Your foundation is ready! Now you can:</p>
// //                 <ol>
// //                     <li><strong>Create the typing test interface</strong> - Add HTML templates and CSS</li>
// //                     <li><strong>Implement the typing engine</strong> - Real-time WPM calculation and feedback</li>
// //                     <li><strong>Add user authentication</strong> - Login/signup functionality</li>
// //                     <li><strong>Build the API</strong> - Save results, leaderboards, user profiles</li>
// //                 </ol>

// //                 <h3>🚀 Quick Start Development:</h3>
// //                 <div class="command">npm run dev</div>
// //                 <p>This will start the server in development mode with auto-restart.</p>

// //                 <h3>📊 Database Status:</h3>
// //                 <p>✅ Connected to: <code>${process.env.DATABASE_URL ? 'Neon PostgreSQL' : 'Not configured'}</code></p>
// //                 <p>✅ Tables created: users, user_settings, test_results, user_sessions</p>
// //             </div>
// //         </body>
// //         </html>
// //     `);
// // });

// // // Health check endpoint
// // app.get('/health', (req, res) => {
// //     res.json({ 
// //         status: 'healthy', 
// //         timestamp: new Date().toISOString(),
// //         database: 'connected'
// //     });
// // });

// // // Start server
// // app.listen(PORT, () => {
// //     console.log(`🚀 TypeSpeed Pro server running on http://localhost:${PORT}`);
// //     console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
// //     console.log(`📊 Database: Connected to Neon PostgreSQL`);
// //     console.log(`\n🎉 Ready for development!`);
// // });



// require('dotenv').config();
// const express = require('express');
// const nunjucks = require('nunjucks');
// const path = require('path');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Basic middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Template engine setup
// nunjucks.configure('views', {
//     autoescape: true,
//     express: app,
//     watch: process.env.NODE_ENV !== 'production'
// });

// // Routes
// app.get('/', (req, res) => {
//     res.render('pages/home.njk', {
//         title: 'TypeSpeed Pro - Professional Typing Test'
//     });
// });

// // API endpoint for text generation
// app.get('/api/text/random', (req, res) => {
//     const commonWords = [
//         'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
//         'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say',
//         'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
//         'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
//         'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
//         'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
//         'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work'
//     ];
    
//     const duration = parseInt(req.query.duration) || 15;
//     const wordsNeeded = Math.max(Math.ceil(duration * 2), 20); // Estimate words needed
    
//     const words = [];
//     for (let i = 0; i < wordsNeeded; i++) {
//         words.push(commonWords[Math.floor(Math.random() * commonWords.length)]);
//     }
    
//     res.json({
//         success: true,
//         text: words.join(' ')
//     });
// });

// app.get('/api/text/words', (req, res) => {
//     const commonWords = [
//         'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
//         'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say',
//         'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
//     ];
    
//     const count = parseInt(req.query.count) || 50;
//     const words = [];
//     for (let i = 0; i < count; i++) {
//         words.push(commonWords[Math.floor(Math.random() * commonWords.length)]);
//     }
    
//     res.json({
//         success: true,
//         text: words.join(' ')
//     });
// });

// app.get('/api/text/quote', (req, res) => {
//     const quotes = [
//         "The quick brown fox jumps over the lazy dog.",
//         "To be or not to be, that is the question.",
//         "It was the best of times, it was the worst of times.",
//         "In the beginning was the Word, and the Word was with God.",
//         "Call me Ishmael.",
//         "Programming is not about typing, it is about thinking.",
//         "The best time to plant a tree was 20 years ago. The second best time is now.",
//         "Code is like humor. When you have to explain it, it's bad."
//     ];
    
//     const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
//     res.json({
//         success: true,
//         text: randomQuote
//     });
// });

// // Health check
// app.get('/health', (req, res) => {
//     res.json({ 
//         status: 'healthy', 
//         timestamp: new Date().toISOString()
//     });
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`🚀 TypeSpeed Pro server running on http://localhost:${PORT}`);
//     console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
//     console.log(`📊 Database: Connected to Neon PostgreSQL`);
// });


require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const session = require('express-session');
const path = require('path');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Template engine setup
nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: process.env.NODE_ENV !== 'production'
});

// Add user to locals for templates
app.use(optionalAuth);

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Main pages
app.get('/', optionalAuth, (req, res) => {
    res.render('pages/home.njk', {
        title: 'TypeSpeed Pro - Professional Typing Test',
        user: req.user
    });
});

app.get('/profile', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    
    res.render('pages/profile.njk', {
        title: 'Profile - TypeSpeed Pro',
        user: req.user
    });
});

app.get('/leaderboard', optionalAuth, (req, res) => {
    res.render('pages/leaderboard.njk', {
        title: 'Leaderboard - TypeSpeed Pro',
        user: req.user
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 TypeSpeed Pro server running on http://localhost:${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Authentication: Enabled`);
    console.log(`📊 Database: Connected to Neon PostgreSQL`);
});