const { pool } = require('../config/database');

class TestResult {
    static async create(userId, resultData) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                `INSERT INTO test_results (
                    user_id, wpm, raw_wpm, accuracy, time_taken, correct_chars,
                    incorrect_chars, total_chars, errors_count, test_mode, test_config, text_content
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [
                    userId,
                    resultData.wpm,
                    resultData.rawWpm,
                    resultData.accuracy,
                    resultData.time,
                    resultData.correctChars,
                    resultData.incorrectChars,
                    resultData.totalChars,
                    resultData.errors,
                    resultData.testMode,
                    JSON.stringify(resultData.testConfig),
                    resultData.text
                ]
            );
            
            return result.rows[0];
            
        } finally {
            client.release();
        }
    }
    
    static async getHistory(userId, page = 1, limit = 10) {
        const client = await pool.connect();
        
        try {
            const offset = (page - 1) * limit;
            
            const result = await client.query(
                `SELECT id, wpm, raw_wpm, accuracy, time_taken, test_mode, created_at
                 FROM test_results 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT $2 OFFSET $3`,
                [userId, limit, offset]
            );
            
            const countResult = await client.query(
                'SELECT COUNT(*) FROM test_results WHERE user_id = $1',
                [userId]
            );
            
            const totalCount = parseInt(countResult.rows[0].count);
            
            return {
                results: result.rows,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1
                }
            };
            
        } finally {
            client.release();
        }
    }
    
    static async getLeaderboard(timeframe = 'all', limit = 10) {
        const client = await pool.connect();
        
        try {
            let dateFilter = '';
            
            switch (timeframe) {
                case 'today':
                    dateFilter = 'AND tr.created_at >= CURRENT_DATE';
                    break;
                case 'week':
                    dateFilter = 'AND tr.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
                    break;
                case 'month':
                    dateFilter = 'AND tr.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
                    break;
            }
            
            const query = `
                SELECT 
                    u.username,
                    MAX(tr.wpm) as wpm,
                    ROUND(AVG(tr.accuracy)) as accuracy,
                    COUNT(tr.id) as tests_count,
                    MAX(tr.created_at) as latest_test
                FROM users u
                JOIN test_results tr ON u.id = tr.user_id
                WHERE tr.accuracy >= 85 ${dateFilter}
                GROUP BY u.id, u.username
                ORDER BY MAX(tr.wpm) DESC, AVG(tr.accuracy) DESC
                LIMIT $1
            `;
            
            const result = await client.query(query, [limit]);
            
            return result.rows.map((entry, index) => ({
                ...entry,
                rank: index + 1
            }));
            
        } finally {
            client.release();
        }
    }
}

module.exports = TestResult;