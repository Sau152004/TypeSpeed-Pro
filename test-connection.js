require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log('Attempting to connect...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        const result = await client.query('SELECT NOW()');
        console.log('📅 Database time:', result.rows[0].now);
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Full error:', error);
    } finally {
        try {
            await client.end();
            console.log('🔌 Connection closed');
        } catch (err) {
            console.error('Error closing connection:', err.message);
        }
    }
}

testConnection();