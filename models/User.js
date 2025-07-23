const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create({ username, email, password }) {
        const client = await pool.connect();
        
        try {
            // Check if user already exists
            const existingUser = await client.query(
                'SELECT id FROM users WHERE email = $1 OR username = $2',
                [email.toLowerCase(), username.toLowerCase()]
            );
            
            if (existingUser.rows.length > 0) {
                throw new Error('User already exists with this email or username');
            }
            
            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Create user
            const result = await client.query(
                `INSERT INTO users (username, email, password_hash, is_verified, created_at)
                 VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
                 RETURNING id, username, email, created_at`,
                [username, email.toLowerCase(), passwordHash]
            );
            
            const user = result.rows[0];
            
            // Create default settings
            await client.query(
                'INSERT INTO user_settings (user_id) VALUES ($1)',
                [user.id]
            );
            
            return user;
            
        } finally {
            client.release();
        }
    }
    
    static async findByEmail(email) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE email = $1',
                [email.toLowerCase()]
            );
            
            return result.rows[0] || null;
            
        } finally {
            client.release();
        }
    }
    
    static async findById(id) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT u.*, us.theme, us.sound_enabled, us.font_family
                 FROM users u
                 LEFT JOIN user_settings us ON u.id = us.user_id
                 WHERE u.id = $1`,
                [id]
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const user = result.rows[0];
            delete user.password_hash;
            
            // Organize settings
            user.settings = {
                theme: user.theme || 'light',
                soundEnabled: user.sound_enabled !== false,
                fontFamily: user.font_family || 'JetBrains Mono'
            };
            
            // Clean up flat fields
            delete user.theme;
            delete user.sound_enabled;
            delete user.font_family;
            
            return user;
            
        } finally {
            client.release();
        }
    }
    
    static async verifyPassword(email, password) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                'SELECT id, password_hash FROM users WHERE email = $1',
                [email.toLowerCase()]
            );
            
            if (result.rows.length === 0) {
                return false;
            }
            
            const user = result.rows[0];
            const isValid = await bcrypt.compare(password, user.password_hash);
            
            if (isValid) {
                // Update last login
                await client.query(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );
                
                return user.id;
            }
            
            return false;
            
        } finally {
            client.release();
        }
    }
    
    static async getStats(userId, timeframe = 'all') {
        const client = await pool.connect();
        
        try {
            let dateFilter = '';
            
            switch (timeframe) {
                case 'today':
                    dateFilter = 'AND created_at >= CURRENT_DATE';
                    break;
                case 'week':
                    dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
                    break;
                case 'month':
                    dateFilter = 'AND created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
                    break;
            }
            
            const query = `
                SELECT 
                    COUNT(*) as tests_completed,
                    ROUND(AVG(wpm)) as avg_wpm,
                    MAX(wpm) as best_wpm,
                    ROUND(AVG(accuracy)) as avg_accuracy,
                    MAX(accuracy) as best_accuracy,
                    ROUND(AVG(time_taken)) as avg_time,
                    SUM(correct_chars) as total_chars_typed,
                    SUM(errors_count) as total_errors
                FROM test_results 
                WHERE user_id = $1 ${dateFilter}
            `;
            
            const result = await client.query(query, [userId]);
            const stats = result.rows[0];
            
            // Get recent tests for progress tracking
            const recentTestsQuery = `
                SELECT wpm, accuracy, created_at
                FROM test_results
                WHERE user_id = $1 ${dateFilter}
                ORDER BY created_at DESC
                LIMIT 20
            `;
            
            const recentTests = await client.query(recentTestsQuery, [userId]);
            
            return {
                ...stats,
                recentTests: recentTests.rows.reverse()
            };
            
        } finally {
            client.release();
        }
    }
}

module.exports = User;