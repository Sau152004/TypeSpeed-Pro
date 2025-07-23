const { pool } = require('../config/database');

class Settings {
    static async getByUserId(userId) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM user_settings WHERE user_id = $1',
                [userId]
            );
            
            if (result.rows.length === 0) {
                // Create default settings if none exist
                return await this.createDefault(userId);
            }
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }
    
    static async createDefault(userId) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `INSERT INTO user_settings (user_id, theme, sound_enabled, sound_volume, font_family, font_size, show_live_wpm, show_live_accuracy)
                 VALUES ($1, 'light', true, 0.3, 'JetBrains Mono', 18, true, true)
                 RETURNING *`,
                [userId]
            );
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }
    
    static async update(userId, settings) {
        const client = await pool.connect();
        
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            
            // Build dynamic update query
            if (settings.theme !== undefined) {
                updateFields.push(`theme = $${paramCount++}`);
                values.push(settings.theme);
            }
            
            if (settings.soundEnabled !== undefined) {
                updateFields.push(`sound_enabled = $${paramCount++}`);
                values.push(settings.soundEnabled);
            }
            
            if (settings.soundVolume !== undefined) {
                updateFields.push(`sound_volume = $${paramCount++}`);
                values.push(settings.soundVolume);
            }
            
            if (settings.fontFamily !== undefined) {
                updateFields.push(`font_family = $${paramCount++}`);
                values.push(settings.fontFamily);
            }
            
            if (settings.fontSize !== undefined) {
                updateFields.push(`font_size = $${paramCount++}`);
                values.push(settings.fontSize);
            }
            
            if (settings.showLiveWpm !== undefined) {
                updateFields.push(`show_live_wpm = $${paramCount++}`);
                values.push(settings.showLiveWpm);
            }
            
            if (settings.showLiveAccuracy !== undefined) {
                updateFields.push(`show_live_accuracy = $${paramCount++}`);
                values.push(settings.showLiveAccuracy);
            }
            
            if (updateFields.length === 0) {
                return await this.getByUserId(userId);
            }
            
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(userId);
            
            const query = `
                UPDATE user_settings 
                SET ${updateFields.join(', ')}
                WHERE user_id = $${paramCount}
                RETURNING *
            `;
            
            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                // Settings don't exist, create them
                return await this.createDefault(userId);
            }
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }
    
    static async delete(userId) {
        const client = await pool.connect();
        
        try {
            await client.query(
                'DELETE FROM user_settings WHERE user_id = $1',
                [userId]
            );
            
            return true;
            
        } finally {
            client.release();
        }
    }
    
    static async getThemeStats() {
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT 
                    theme,
                    COUNT(*) as user_count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
                FROM user_settings 
                GROUP BY theme
                ORDER BY user_count DESC
            `);
            
            return result.rows;
            
        } finally {
            client.release();
        }
    }
    
    static async getFontStats() {
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT 
                    font_family,
                    COUNT(*) as user_count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
                FROM user_settings 
                GROUP BY font_family
                ORDER BY user_count DESC
                LIMIT 10
            `);
            
            return result.rows;
            
        } finally {
            client.release();
        }
    }
    
    static async getAverageSettings() {
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT 
                    ROUND(AVG(sound_volume), 2) as avg_sound_volume,
                    ROUND(AVG(font_size), 1) as avg_font_size,
                    ROUND(COUNT(CASE WHEN sound_enabled THEN 1 END) * 100.0 / COUNT(*), 2) as sound_enabled_percentage,
                    ROUND(COUNT(CASE WHEN show_live_wpm THEN 1 END) * 100.0 / COUNT(*), 2) as live_wpm_percentage,
                    ROUND(COUNT(CASE WHEN show_live_accuracy THEN 1 END) * 100.0 / COUNT(*), 2) as live_accuracy_percentage
                FROM user_settings
            `);
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }
    
    static validateSettings(settings) {
        const errors = [];
        
        if (settings.theme && !['light', 'dark'].includes(settings.theme)) {
            errors.push('Theme must be either "light" or "dark"');
        }
        
        if (settings.soundVolume !== undefined && (settings.soundVolume < 0 || settings.soundVolume > 1)) {
            errors.push('Sound volume must be between 0 and 1');
        }
        
        if (settings.fontSize !== undefined && (settings.fontSize < 12 || settings.fontSize > 32)) {
            errors.push('Font size must be between 12 and 32');
        }
        
        if (settings.fontFamily && settings.fontFamily.length > 50) {
            errors.push('Font family name is too long');
        }
        
        return errors;
    }
}

module.exports = Settings;