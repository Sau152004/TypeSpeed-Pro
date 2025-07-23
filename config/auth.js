const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const client = await pool.connect();
        
        const userResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (userResult.rows.length === 0) {
            client.release();
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        const user = userResult.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            client.release();
            return done(null, false, { message: 'Invalid email or password' });
        }
        
        // Update last login
        await client.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        client.release();
        
        // Remove password hash from user object
        delete user.password_hash;
        return done(null, user);
        
    } catch (error) {
        console.error('Local strategy error:', error);
        return done(error);
    }
}));

// Google Strategy (optional)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const client = await pool.connect();
            
            // Check if user exists with Google ID
            let userResult = await client.query(
                'SELECT * FROM users WHERE google_id = $1',
                [profile.id]
            );
            
            let user;
            
            if (userResult.rows.length > 0) {
                // User exists, update last login
                user = userResult.rows[0];
                await client.query(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );
            } else {
                // Check if user exists with same email
                userResult = await client.query(
                    'SELECT * FROM users WHERE email = $1',
                    [profile.emails[0].value.toLowerCase()]
                );
                
                if (userResult.rows.length > 0) {
                    // Link Google account to existing user
                    user = userResult.rows[0];
                    await client.query(
                        'UPDATE users SET google_id = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2',
                        [profile.id, user.id]
                    );
                } else {
                    // Create new user
                    const username = await generateUniqueUsername(profile.displayName || profile.emails[0].value.split('@')[0]);
                    
                    const newUserResult = await client.query(
                        `INSERT INTO users (username, email, password_hash, google_id, is_verified, last_login)
                         VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
                         RETURNING *`,
                        [username, profile.emails[0].value.toLowerCase(), '', profile.id]
                    );
                    
                    user = newUserResult.rows[0];
                    
                    // Create default settings
                    await client.query(
                        'INSERT INTO user_settings (user_id) VALUES ($1)',
                        [user.id]
                    );
                }
            }
            
            client.release();
            delete user.password_hash;
            return done(null, user);
            
        } catch (error) {
            console.error('Google strategy error:', error);
            return done(error);
        }
    }));
}

// Generate unique username
async function generateUniqueUsername(baseName) {
    const client = await pool.connect();
    let username = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let counter = 0;
    
    try {
        while (true) {
            const testUsername = counter === 0 ? username : `${username}${counter}`;
            
            const result = await client.query(
                'SELECT id FROM users WHERE username = $1',
                [testUsername]
            );
            
            if (result.rows.length === 0) {
                return testUsername;
            }
            
            counter++;
            if (counter > 1000) {
                throw new Error('Unable to generate unique username');
            }
        }
    } finally {
        client.release();
    }
}

// Serialize/Deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const client = await pool.connect();
        
        const userResult = await client.query(
            `SELECT u.*, us.theme, us.sound_enabled, us.sound_volume, us.font_family, us.font_size,
                    us.show_live_wpm, us.show_live_accuracy
             FROM users u
             LEFT JOIN user_settings us ON u.id = us.user_id
             WHERE u.id = $1`,
            [id]
        );
        
        if (userResult.rows.length === 0) {
            client.release();
            return done(null, false);
        }
        
        const user = userResult.rows[0];
        delete user.password_hash;
        
        // Organize settings
        user.settings = {
            theme: user.theme || 'light',
            soundEnabled: user.sound_enabled !== false,
            soundVolume: user.sound_volume || 0.3,
            fontFamily: user.font_family || 'JetBrains Mono',
            fontSize: user.font_size || 18,
            showLiveWpm: user.show_live_wpm !== false,
            showLiveAccuracy: user.show_live_accuracy !== false
        };
        
        // Clean up flat settings fields
        delete user.theme;
        delete user.sound_enabled;
        delete user.sound_volume;
        delete user.font_family;
        delete user.font_size;
        delete user.show_live_wpm;
        delete user.show_live_accuracy;
        
        client.release();
        done(null, user);
        
    } catch (error) {
        console.error('Deserialize user error:', error);
        done(error);
    }
});

module.exports = passport;