// const { pool } = require('../config/database');

// class TestResult {
//     static async create(userId, resultData) {
//         const client = await pool.connect();
        
//         try {
//             const result = await client.query(
//                 `INSERT INTO test_results (
//                     user_id, wpm, raw_wpm, accuracy, time_taken, correct_chars,
//                     incorrect_chars, total_chars, errors_count, test_mode, test_config, text_content
//                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
//                 RETURNING *`,
//                 [
//                     userId,
//                     resultData.wpm,
//                     resultData.rawWpm,
//                     resultData.accuracy,
//                     resultData.time,
//                     resultData.correctChars,
//                     resultData.incorrectChars,
//                     resultData.totalChars,
//                     resultData.errors,
//                     resultData.testMode,
//                     JSON.stringify(resultData.testConfig),
//                     resultData.text
//                 ]
//             );
            
//             return result.rows[0];
            
//         } finally {
//             client.release();
//         }
//     }
    
//     static async getHistory(userId, page = 1, limit = 10) {
//         const client = await pool.connect();
        
//         try {
//             const offset = (page - 1) * limit;
            
//             const result = await client.query(
//                 `SELECT id, wpm, raw_wpm, accuracy, time_taken, test_mode, created_at
//                  FROM test_results 
//                  WHERE user_id = $1 
//                  ORDER BY created_at DESC 
//                  LIMIT $2 OFFSET $3`,
//                 [userId, limit, offset]
//             );
            
//             const countResult = await client.query(
//                 'SELECT COUNT(*) FROM test_results WHERE user_id = $1',
//                 [userId]
//             );
            
//             const totalCount = parseInt(countResult.rows[0].count);
            
//             return {
//                 results: result.rows,
//                 pagination: {
//                     currentPage: page,
//                     totalPages: Math.ceil(totalCount / limit),
//                     totalCount,
//                     hasNext: page < Math.ceil(totalCount / limit),
//                     hasPrev: page > 1
//                 }
//             };
            
//         } finally {
//             client.release();
//         }
//     }
    
//     static async getLeaderboard(timeframe = 'all', limit = 10) {
//         const client = await pool.connect();
        
//         try {
//             let dateFilter = '';
            
//             switch (timeframe) {
//                 case 'today':
//                     dateFilter = 'AND tr.created_at >= CURRENT_DATE';
//                     break;
//                 case 'week':
//                     dateFilter = 'AND tr.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
//                     break;
//                 case 'month':
//                     dateFilter = 'AND tr.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
//                     break;
//             }
            
//             const query = `
//                 SELECT 
//                     u.username,
//                     MAX(tr.wpm) as wpm,
//                     ROUND(AVG(tr.accuracy)) as accuracy,
//                     COUNT(tr.id) as tests_count,
//                     MAX(tr.created_at) as latest_test
//                 FROM users u
//                 JOIN test_results tr ON u.id = tr.user_id
//                 WHERE tr.accuracy >= 85 ${dateFilter}
//                 GROUP BY u.id, u.username
//                 ORDER BY MAX(tr.wpm) DESC, AVG(tr.accuracy) DESC
//                 LIMIT $1
//             `;
            
//             const result = await client.query(query, [limit]);
            
//             return result.rows.map((entry, index) => ({
//                 ...entry,
//                 rank: index + 1
//             }));
            
//         } finally {
//             client.release();
//         }
//     }
// }

// module.exports = TestResult;






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
    
    // NEW METHOD: Get user's rank in leaderboard
    static async getUserRank(userId, timeframe = 'all') {
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
            
            // Get user's best WPM for the timeframe
            const userBestResult = await client.query(
                `SELECT MAX(wpm) as best_wpm
                 FROM test_results 
                 WHERE user_id = $1 AND accuracy >= 85 ${dateFilter}`,
                [userId]
            );
            
            const userBestWpm = userBestResult.rows[0]?.best_wpm;
            
            if (!userBestWpm) {
                return {
                    rank: null,
                    totalUsers: 0,
                    userBestWpm: 0
                };
            }
            
            // Count how many users have better WPM
            const rankResult = await client.query(
                `SELECT COUNT(DISTINCT u.id) as better_users
                 FROM users u
                 JOIN test_results tr ON u.id = tr.user_id
                 WHERE tr.accuracy >= 85 ${dateFilter}
                 GROUP BY u.id
                 HAVING MAX(tr.wpm) > $1`,
                [userBestWpm]
            );
            
            const rank = (rankResult.rows[0]?.better_users || 0) + 1;
            
            // Get total number of users with valid scores
            const totalResult = await client.query(
                `SELECT COUNT(DISTINCT u.id) as total_users
                 FROM users u
                 JOIN test_results tr ON u.id = tr.user_id
                 WHERE tr.accuracy >= 85 ${dateFilter}`
            );
            
            const totalUsers = totalResult.rows[0]?.total_users || 0;
            
            return {
                rank,
                totalUsers,
                userBestWpm
            };
            
        } finally {
            client.release();
        }
    }
    
    // NEW METHOD: Get user statistics
    static async getUserStats(userId, timeframe = 'all') {
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
            
            const result = await client.query(
                `SELECT 
                    COUNT(*) as tests_completed,
                    ROUND(AVG(wpm)) as avg_wpm,
                    MAX(wpm) as best_wpm,
                    ROUND(AVG(accuracy)) as avg_accuracy,
                    MAX(accuracy) as best_accuracy,
                    SUM(time_taken) as total_time,
                    SUM(correct_chars) as total_chars_typed,
                    SUM(errors_count) as total_errors
                FROM test_results 
                WHERE user_id = $1 ${dateFilter}`,
                [userId]
            );
            
            return result.rows[0] || {
                tests_completed: 0,
                avg_wpm: 0,
                best_wpm: 0,
                avg_accuracy: 0,
                best_accuracy: 0,
                total_time: 0,
                total_chars_typed: 0,
                total_errors: 0
            };
            
        } finally {
            client.release();
        }
    }
    
    // NEW METHOD: Delete test result
    static async delete(resultId, userId) {
        const client = await pool.connect();
        
        try {
            const result = await client.query(
                'DELETE FROM test_results WHERE id = $1 AND user_id = $2 RETURNING id',
                [resultId, userId]
            );
            
            return result.rows.length > 0;
            
        } finally {
            client.release();
        }
    }
    
    // NEW METHOD: Get global statistics
    static async getGlobalStats() {
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT 
                    COUNT(*) as total_tests,
                    COUNT(DISTINCT user_id) as total_users,
                    ROUND(AVG(wpm)) as avg_wpm,
                    MAX(wpm) as highest_wpm,
                    ROUND(AVG(accuracy)) as avg_accuracy
                FROM test_results
                WHERE accuracy >= 50
            `);
            
            return result.rows[0] || {
                total_tests: 0,
                total_users: 0,
                avg_wpm: 0,
                highest_wpm: 0,
                avg_accuracy: 0
            };
            
        } finally {
            client.release();
        }
    }
}

module.exports = TestResult;