class ProfileManager {
    constructor() {
        this.loadUserStats();
        this.loadTestHistory();
    }
    
    async loadUserStats() {
        try {
            const response = await fetch('/api/user/stats');
            const data = await response.json();
            
            if (data.success) {
                this.displayStats(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('user-stats').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Failed to load statistics</p>
                </div>
            `;
        }
    }
    
    async loadTestHistory() {
        try {
            const response = await fetch('/api/test/history?limit=10');
            const data = await response.json();
            
            if (data.success) {
                this.displayHistory(data.data.results);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            document.getElementById('test-history').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">Failed to load test history</p>
                </div>
            `;
        }
    }
    
    displayStats(stats) {
        const container = document.getElementById('user-stats');
        
        if (parseInt(stats.tests_completed) === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-4">🎯</div>
                    <h3 class="text-lg font-medium mb-2">No tests completed yet</h3>
                    <p class="text-gray-500 dark:text-gray-400 mb-4">Start typing to see your statistics here!</p>
                    <a href="/" class="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors">
                        Take Your First Test
                    </a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div class="text-center">
                    <div class="text-3xl font-bold text-primary-600">${stats.tests_completed || 0}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Tests Completed</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600">${stats.best_wpm || 0}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Best WPM</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600">${stats.avg_wpm || 0}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Average WPM</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-600">${stats.best_accuracy || 0}%</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Best Accuracy</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-lg font-semibold">${stats.total_chars_typed || 0}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Total Characters</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-semibold">${stats.avg_accuracy || 0}%</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Average Accuracy</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-semibold">${stats.total_errors || 0}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Total Errors</div>
                </div>
            </div>
        `;
    }
    
    displayHistory(tests) {
        const container = document.getElementById('test-history');
        
        if (tests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500 dark:text-gray-400">No test history yet</p>
                </div>
            `;
            return;
        }
        
        const historyHtml = tests.map(test => {
            const date = new Date(test.created_at).toLocaleDateString();
            const time = new Date(test.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div class="flex items-center space-x-4">
                        <div class="text-center">
                            <div class="text-lg font-bold text-primary-600">${test.wpm}</div>
                            <div class="text-xs text-gray-500">WPM</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-bold text-green-600">${Math.round(test.accuracy)}%</div>
                            <div class="text-xs text-gray-500">Accuracy</div>
                        </div>
                        <div>
                            <div class="text-sm font-medium">${test.test_mode.charAt(0).toUpperCase() + test.test_mode.slice(1)} Test</div>
                            <div class="text-xs text-gray-500">${test.time_taken}s duration</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">${date}</div>
                        <div class="text-xs text-gray-400">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = historyHtml;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});