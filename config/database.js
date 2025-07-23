const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

pool.on('connect', () => {
    console.log('📊 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('📊 PostgreSQL connection error:', err);
});

const initializeDatabase = async () => {
    let client;
    try {
        console.log('🔄 Attempting to connect to database...');
        client = await pool.connect();
        console.log('✅ Database connection established');
        
        console.log('📋 Creating users table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                google_id VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_verified BOOLEAN DEFAULT false,
                last_login TIMESTAMP
            );
        `);
        console.log('✅ Users table created/verified');
        
        console.log('📋 Creating user_settings table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                theme VARCHAR(20) DEFAULT 'light',
                sound_enabled BOOLEAN DEFAULT true,
                sound_volume DECIMAL(3,2) DEFAULT 0.3,
                font_family VARCHAR(50) DEFAULT 'JetBrains Mono',
                font_size INTEGER DEFAULT 18,
                show_live_wpm BOOLEAN DEFAULT true,
                show_live_accuracy BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ User settings table created/verified');
        
        console.log('📋 Creating test_results table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_results (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                wpm INTEGER NOT NULL,
                raw_wpm INTEGER NOT NULL,
                accuracy DECIMAL(5,2) NOT NULL,
                time_taken INTEGER NOT NULL,
                correct_chars INTEGER NOT NULL,
                incorrect_chars INTEGER NOT NULL,
                total_chars INTEGER NOT NULL,
                errors_count INTEGER NOT NULL,
                test_mode VARCHAR(20) NOT NULL,
                test_config JSONB,
                text_content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Test results table created/verified');
        
        console.log('📋 Creating user_sessions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                sid VARCHAR NOT NULL COLLATE "default",
                sess JSON NOT NULL,
                expire TIMESTAMP(6) NOT NULL
            );
        `);
        console.log('✅ Sessions table created/verified');
        
        console.log('📋 Adding constraints and indexes...');
        try {
            await client.query(`
                ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
            `);
            console.log('✅ Session primary key constraint added');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('ℹ️ Session primary key constraint already exists');
            } else {
                console.warn('⚠️ Session constraint warning:', err.message);
            }
        }
        
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
        console.log('✅ Indexes created/verified');
        
        console.log('🎉 Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    } finally {
        if (client) {
            try {
                client.release();
                console.log('🔌 Database connection released');
            } catch (releaseError) {
                console.error('⚠️ Error releasing connection:', releaseError.message);
            }
        }
    }
};

module.exports = {
    pool,
    initializeDatabase
};