const TestResult = require('../models/TestResult');

const onlineUsers = new Map();

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);
        
        socket.on('join-user', (userId) => {
            if (userId) {
                onlineUsers.set(socket.id, userId);
                socket.userId = userId;
                
                // Broadcast online user count
                io.emit('user-online', {
                    count: onlineUsers.size
                });
                
                console.log(`👤 User ${userId} joined. Online: ${onlineUsers.size}`);
            }
        });
        
        socket.on('new-result', async (resultData) => {
            try {
                // Fetch updated leaderboard
                const leaderboard = await TestResult.getLeaderboard('today', 10);
                
                // Broadcast leaderboard update
                io.emit('leaderboard-update', {
                    leaderboard,
                    newResult: resultData
                });
                
                console.log(`📊 Leaderboard updated after new result from user ${socket.userId}`);
            } catch (error) {
                console.error('Socket leaderboard update error:', error);
            }
        });
        
        socket.on('typing-started', (data) => {
            // Broadcast typing activity (optional feature)
            socket.broadcast.emit('user-typing', {
                userId: socket.userId,
                ...data
            });
        });
        
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
            
            if (onlineUsers.has(socket.id)) {
                const userId = onlineUsers.get(socket.id);
                onlineUsers.delete(socket.id);
                
                // Broadcast updated online count
                io.emit('user-online', {
                    count: onlineUsers.size
                });
                
                console.log(`👤 User ${userId} left. Online: ${onlineUsers.size}`);
            }
        });
        
        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
    
    // Periodic leaderboard updates
    setInterval(async () => {
        try {
            const leaderboard = await TestResult.getLeaderboard('today', 10);
            io.emit('leaderboard-update', { leaderboard });
        } catch (error) {
            console.error('Periodic leaderboard update error:', error);
        }
    }, 30000); // Update every 30 seconds
}

function getOnlineUserCount() {
    return onlineUsers.size;
}

function getOnlineUsers() {
    return Array.from(onlineUsers.values());
}

module.exports = { 
    setupSocket, 
    getOnlineUserCount, 
    getOnlineUsers 
};