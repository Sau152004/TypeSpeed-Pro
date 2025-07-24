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
    
    // NEW METHOD: Get personal best
    static async getPersonalBest(userId) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `SELECT 
                    MAX(wpm) as best_wpm,
                    MAX(accuracy) as best_accuracy,
                    MIN(time_taken) as best_time,
                    COUNT(*) as total_tests
                FROM test_results 
                WHERE user_id = $1`,
                [userId]
            );
            
            return result.rows[0] || {
                best_wpm: 0,
                best_accuracy: 0,
                best_time: 0,
                total_tests: 0
            };
            
        } finally {
            client.release();
        }
    }
    
    // NEW METHOD: Update password
    static async updatePassword(userId, newPassword) {
        const client = await pool.connect();
        
        try {
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(newPassword, saltRounds);
            
            await client.query(
                'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [passwordHash, userId]
            );
            
            return true;
            
        } finally {
            client.release();
        }
    }
    
    // NEW METHOD: Update profile
    static async updateProfile(userId, { username, email }) {
        const client = await pool.connect();
        
        try {
            // Check if username or email already exists (excluding current user)
            if (username || email) {
                let checkQuery = 'SELECT id FROM users WHERE id != $1 AND (';
                const checkParams = [userId];
                const conditions = [];
                
                if (username) {
                    conditions.push(`username = $${checkParams.length + 1}`);
                    checkParams.push(username.toLowerCase());
                }
                
                if (email) {
                    conditions.push(`email = $${checkParams.length + 1}`);
                    checkParams.push(email.toLowerCase());
                }
                
                checkQuery += conditions.join(' OR ') + ')';
                
                const existingUser = await client.query(checkQuery, checkParams);
                
                if (existingUser.rows.length > 0) {
                    return false; // Username or email already exists
                }
            }
            
            // Build update query dynamically
            const updateFields = [];
            const updateParams = [];
            let paramCount = 1;
            
            if (username) {
                updateFields.push(`username = $${paramCount++}`);
                updateParams.push(username.toLowerCase());
            }
            
            if (email) {
                updateFields.push(`email = $${paramCount++}`);
                updateParams.push(email.toLowerCase());
            }
            
            if (updateFields.length === 0) {
                return true; // Nothing to update
            }
            
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateParams.push(userId);
            
            const updateQuery = `
                UPDATE users 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramCount}
            `;
            
            await client.query(updateQuery, updateParams);
            return true;
            
        } finally {
            client.release();
        }
    }
    
    // NEW METHOD: Update settings
    static async updateSettings(userId, settings) {
        const client = await pool.connect();
        
        try {
            const updateFields = [];
            const updateParams = [];
            let paramCount = 1;
            
            if (settings.theme !== undefined) {
                updateFields.push(`theme = $${paramCount++}`);
                updateParams.push(settings.theme);
            }
            
            if (settings.soundEnabled !== undefined) {
                updateFields.push(`sound_enabled = $${paramCount++}`);
                updateParams.push(settings.soundEnabled);
            }
            
            if (settings.soundVolume !== undefined) {
                updateFields.push(`sound_volume = $${paramCount++}`);
                updateParams.push(settings.soundVolume);
            }
            
            if (settings.fontFamily !== undefined) {
                updateFields.push(`font_family = $${paramCount++}`);
                updateParams.push(settings.fontFamily);
            }
            
            if (settings.fontSize !== undefined) {
                updateFields.push(`font_size = $${paramCount++}`);
                updateParams.push(settings.fontSize);
            }
            
            if (updateFields.length === 0) {
                return true; // Nothing to update
            }
            
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateParams.push(userId);
            
            const updateQuery = `
                UPDATE user_settings 
                SET ${updateFields.join(', ')}
                WHERE user_id = $${paramCount}
            `;
            
            await client.query(updateQuery, updateParams);
            return true;
            
        } finally {
            client.release();
        }
    }
    
    // NEW METHOD: Delete user
    static async delete(userId) {
        const client = await pool.connect();
        
        try {
            // Delete user (CASCADE will handle related records)
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            return true;
            
        } finally {
            client.release();
        }
    }
}

module.exports = User;