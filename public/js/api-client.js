class ApiClient {
    constructor() {
        this.baseUrl = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    // Test Results
    async saveTestResult(result) {
        return this.request('/api/test/save', {
            method: 'POST',
            body: JSON.stringify(result)
        });
    }
    
    async getTestHistory(page = 1, limit = 10) {
        return this.request(`/api/test/history?page=${page}&limit=${limit}`);
    }
    
    // User Profile
    async getUserProfile() {
        return this.request('/api/user/profile');
    }
    
    async updateUserSettings(settings) {
        return this.request('/api/user/settings', {
            method: 'PATCH',
            body: JSON.stringify(settings)
        });
    }
    
    async getPersonalBest() {
        return this.request('/api/user/personal-best');
    }
    
    // Leaderboard
    async getLeaderboard(timeframe = 'all', page = 1, limit = 10) {
        return this.request(`/api/leaderboard?timeframe=${timeframe}&page=${page}&limit=${limit}`);
    }
    
    // Text Generation
    async getRandomText(duration) {
        return this.request(`/api/text/random?duration=${duration}`);
    }
    
    async getWordsText(count) {
        return this.request(`/api/text/words?count=${count}`);
    }
    
    async getQuote() {
        return this.request('/api/text/quote');
    }
    
    // Statistics
    async getUserStats(timeframe = 'all') {
        return this.request(`/api/user/stats?timeframe=${timeframe}`);
    }
}

// Initialize API client
window.apiClient = new ApiClient();