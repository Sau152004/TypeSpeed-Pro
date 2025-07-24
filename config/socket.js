// const TestResult = require('../models/TestResult');

// const onlineUsers = new Map();

// function setupSocket(io) {
//     io.on('connection', (socket) => {
//         console.log(`🔌 User connected: ${socket.id}`);
        
//         socket.on('join-user', (userId) => {
//             if (userId) {
//                 onlineUsers.set(socket.id, userId);
//                 socket.userId = userId;
                
//                 // Broadcast online user count
//                 io.emit('user-online', {
//                     count: onlineUsers.size
//                 });
                
//                 console.log(`👤 User ${userId} joined. Online: ${onlineUsers.size}`);
//             }
//         });
        
//         socket.on('new-result', async (resultData) => {
//             try {
//                 // Fetch updated leaderboard
//                 const leaderboard = await TestResult.getLeaderboard('today', 10);
                
//                 // Broadcast leaderboard update
//                 io.emit('leaderboard-update', {
//                     leaderboard,
//                     newResult: resultData
//                 });
                
//                 console.log(`📊 Leaderboard updated after new result from user ${socket.userId}`);
//             } catch (error) {
//                 console.error('Socket leaderboard update error:', error);
//             }
//         });
        
//         socket.on('typing-started', (data) => {
//             // Broadcast typing activity (optional feature)
//             socket.broadcast.emit('user-typing', {
//                 userId: socket.userId,
//                 ...data
//             });
//         });
        
//         socket.on('disconnect', () => {
//             console.log(`🔌 User disconnected: ${socket.id}`);
            
//             if (onlineUsers.has(socket.id)) {
//                 const userId = onlineUsers.get(socket.id);
//                 onlineUsers.delete(socket.id);
                
//                 // Broadcast updated online count
//                 io.emit('user-online', {
//                     count: onlineUsers.size
//                 });
                
//                 console.log(`👤 User ${userId} left. Online: ${onlineUsers.size}`);
//             }
//         });
        
//         // Handle errors
//         socket.on('error', (error) => {
//             console.error('Socket error:', error);
//         });
//     });
    
//     // Periodic leaderboard updates
//     setInterval(async () => {
//         try {
//             const leaderboard = await TestResult.getLeaderboard('today', 10);
//             io.emit('leaderboard-update', { leaderboard });
//         } catch (error) {
//             console.error('Periodic leaderboard update error:', error);
//         }
//     }, 30000); // Update every 30 seconds
// }

// function getOnlineUserCount() {
//     return onlineUsers.size;
// }

// function getOnlineUsers() {
//     return Array.from(onlineUsers.values());
// }

// module.exports = { 
//     setupSocket, 
//     getOnlineUserCount, 
//     getOnlineUsers 
// };




const TestResult = require('../models/TestResult');

const onlineUsers = new Map();

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);
        
        // Handle user joining
        socket.on('join-user', (userId) => {
            if (userId) {
                onlineUsers.set(socket.id, userId);
                socket.userId = userId;
                
                // Join user to their own room for private notifications
                socket.join(`user-${userId}`);
                
                // Broadcast online user count
                io.emit('user-online', {
                    count: onlineUsers.size
                });
                
                console.log(`👤 User ${userId} joined. Online: ${onlineUsers.size}`);
            }
        });
        
        // Handle new test result
        socket.on('new-result', async (resultData) => {
            try {
                if (socket.userId) {
                    // Fetch updated leaderboard
                    const leaderboard = await TestResult.getLeaderboard('today', 10);
                    
                    // Broadcast leaderboard update to all users
                    io.emit('leaderboard-update', {
                        leaderboard,
                        newResult: {
                            userId: socket.userId,
                            ...resultData
                        }
                    });
                    
                    console.log(`📊 Leaderboard updated after new result from user ${socket.userId}`);
                }
            } catch (error) {
                console.error('Socket leaderboard update error:', error);
            }
        });
        
        // Handle typing started event
        socket.on('typing-started', (data) => {
            if (socket.userId) {
                // Broadcast typing activity to other users (optional feature)
                socket.broadcast.emit('user-typing', {
                    userId: socket.userId,
                    timestamp: Date.now(),
                    ...data
                });
            }
        });
        
        // Handle typing completed event
        socket.on('typing-completed', (data) => {
            if (socket.userId) {
                socket.broadcast.emit('user-completed', {
                    userId: socket.userId,
                    timestamp: Date.now(),
                    ...data
                });
            }
        });
        
        // Handle real-time competition updates
        socket.on('join-competition', (competitionId) => {
            socket.join(`competition-${competitionId}`);
            console.log(`User ${socket.userId} joined competition ${competitionId}`);
        });
        
        socket.on('leave-competition', (competitionId) => {
            socket.leave(`competition-${competitionId}`);
            console.log(`User ${socket.userId} left competition ${competitionId}`);
        });
        
        // Handle chat messages (if you add chat functionality)
        socket.on('chat-message', (data) => {
            if (socket.userId) {
                io.emit('chat-message', {
                    userId: socket.userId,
                    message: data.message,
                    timestamp: Date.now()
                });
            }
        });
        
        // Handle disconnect
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
        
        // Send initial data to newly connected user
        socket.emit('connection-established', {
            socketId: socket.id,
            onlineUsers: onlineUsers.size,
            timestamp: Date.now()
        });
    });
    
    // Periodic updates
    setInterval(async () => {
        try {
            // Update leaderboard every 30 seconds
            const leaderboard = await TestResult.getLeaderboard('today', 10);
            io.emit('leaderboard-periodic-update', { 
                leaderboard,
                timestamp: Date.now()
            });
            
            // Send online user count
            io.emit('user-online', {
                count: onlineUsers.size,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('Periodic socket updates error:', error);
        }
    }, 30000); // Every 30 seconds
    
    // Clean up inactive connections every 5 minutes
    setInterval(() => {
        console.log(`🧹 Socket cleanup - Online users: ${onlineUsers.size}`);
    }, 300000); // Every 5 minutes
}

function getOnlineUserCount() {
    return onlineUsers.size;
}

function getOnlineUsers() {
    return Array.from(onlineUsers.values());
}

function broadcastToUser(userId, event, data) {
    const io = require('socket.io-client');
    if (io) {
        io.to(`user-${userId}`).emit(event, data);
    }
}

function broadcastToCompetition(competitionId, event, data) {
    const io = require('socket.io-client');
    if (io) {
        io.to(`competition-${competitionId}`).emit(event, data);
    }
}

module.exports = { 
    setupSocket, 
    getOnlineUserCount, 
    getOnlineUsers,
    broadcastToUser,
    broadcastToCompetition
};