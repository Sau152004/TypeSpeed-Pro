// Global application state and utilities
class App {
    constructor() {
        this.user = window.user || null;
        this.socket = null;
        this.initializeSocket();
        this.bindGlobalEvents();
        this.initializeModals();
        this.initializeTheme();
        this.initializeTypingEngine();
    }
    
    initializeSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                if (this.user) {
                    this.socket.emit('join-user', this.user.id);
                }
            });
            
            this.socket.on('leaderboard-update', (data) => {
                this.updateLeaderboard(data);
            });
            
            this.socket.on('user-online', (data) => {
                this.updateOnlineUsers(data);
            });
        }
    }
    
    initializeTheme() {
        this.themeManager = new ThemeManager();
    }
    
    initializeTypingEngine() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.typingEngine = new TypingEngine();
            });
        } else {
            this.typingEngine = new TypingEngine();
        }
    }
    
    bindGlobalEvents() {
        // Navigation mobile menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        
        // User dropdown menu
        const userMenu = document.getElementById('user-menu');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenu && userDropdown) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
            
            document.addEventListener('click', () => {
                userDropdown.classList.add('hidden');
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }
        
        // Result action buttons
        this.bindResultActions();
        
        // Handle save result button - NEW INTEGRATION
        document.addEventListener('click', (e) => {
            if (e.target.id === 'save-result') {
                if (this.typingEngine) {
                    this.typingEngine.saveResult();
                }
            }
        });
        
        // Click outside to focus typing input
        document.addEventListener('click', (e) => {
            const typingInput = document.getElementById('typing-input');
            if (typingInput && !typingInput.disabled && 
                !e.target.closest('button') && 
                !e.target.closest('select') && 
                !e.target.closest('input')) {
                typingInput.focus();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    bindResultActions() {
        const retryBtn = document.getElementById('retry-test');
        const saveBtn = document.getElementById('save-result');
        const shareBtn = document.getElementById('share-results');
        const historyBtn = document.getElementById('view-history');
        
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                if (this.typingEngine) {
                    this.typingEngine.resetTest();
                }
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveTestResult();
            });
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareResults();
            });
        }
        
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                window.location.href = '/profile';
            });
        }
    }
    
    initializeModals() {
        // Settings modal
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsBtn = document.getElementById('close-settings');
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.closeSettingsModal();
            });
        }
        
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettingsModal();
                }
            });
        }
        
        // Custom text modal events
        const customModal = document.getElementById('custom-text-modal');
        if (customModal) {
            customModal.addEventListener('click', (e) => {
                if (e.target === customModal) {
                    customModal.classList.add('hidden');
                    customModal.classList.remove('flex');
                }
            });
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing
        if (e.target.type === 'text' || e.target.type === 'textarea') return;
        
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'enter':
                    e.preventDefault();
                    if (this.typingEngine && !this.typingEngine.isActive) {
                        this.typingEngine.startTest();
                    }
                    break;
                case 'r':
                    e.preventDefault();
                    if (this.typingEngine) {
                        this.typingEngine.resetTest();
                    }
                    break;
            }
        }
        
        switch (e.key) {
            case 'Escape':
                this.closeAllModals();
                break;
        }
    }
    
    async saveTestResult() {
        if (!this.user) {
            this.showLoginPrompt();
            return;
        }
        
        if (!this.typingEngine || this.typingEngine.isActive) {
            this.showToast('Complete a test first', 'warning');
            return;
        }
        
        try {
            const stats = this.typingEngine.calculateFinalStats();
            const result = {
                wpm: Math.round(stats.wpm),
                rawWpm: Math.round(stats.rawWpm),
                accuracy: Math.round(stats.accuracy),
                time: Math.round(stats.time),
                correctChars: stats.correctChars,
                incorrectChars: stats.incorrectChars,
                totalChars: stats.totalChars,
                errors: this.typingEngine.errors.length,
                testMode: this.typingEngine.testConfig.mode,
                testConfig: this.typingEngine.testConfig,
                text: this.typingEngine.currentText
            };
            
            const response = await fetch('/api/test/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Test result saved! 💾', 'success');
                
                // Update save button
                const saveBtn = document.getElementById('save-result');
                if (saveBtn) {
                    saveBtn.textContent = 'Saved ✓';
                    saveBtn.disabled = true;
                    saveBtn.classList.add('opacity-50');
                }
                
                // Update leaderboard if connected
                if (this.socket) {
                    this.socket.emit('new-result', result);
                }
            } else {
                throw new Error(data.message || 'Failed to save');
            }
        } catch (error) {
            console.error('Failed to save result:', error);
            if (error.message.includes('Authentication')) {
                this.showToast('Please login to save results', 'warning');
            } else {
                this.showToast('Failed to save result', 'error');
            }
        }
    }
    
    shareResults() {
        if (!this.typingEngine || this.typingEngine.isActive) {
            this.showToast('Complete a test first', 'warning');
            return;
        }
        
        const stats = this.typingEngine.calculateFinalStats();
        const shareText = `I just typed ${Math.round(stats.wpm)} WPM with ${Math.round(stats.accuracy)}% accuracy on TypeSpeed Pro! 🚀`;
        const shareUrl = window.location.origin;
        
        if (navigator.share) {
            navigator.share({
                title: 'TypeSpeed Pro - Typing Test Results',
                text: shareText,
                url: shareUrl
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback to clipboard
            const fullText = `${shareText}\n\nTry it yourself: ${shareUrl}`;
            navigator.clipboard.writeText(fullText).then(() => {
                this.showToast('Results copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Unable to copy to clipboard', 'error');
            });
        }
    }
    
    showLoginPrompt() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
                <h3 class="text-xl font-bold mb-4">Login Required</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                    Please log in to save your test results and track your progress.
                </p>
                <div class="flex space-x-3">
                    <button class="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors" onclick="window.location.href='/auth/login'">
                        Login
                    </button>
                    <button class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors" onclick="this.closest('.fixed').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }
    
    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Load current settings
            this.loadSettingsValues();
        }
    }
    
    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }
    
    loadSettingsValues() {
        // Theme
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect && this.themeManager) {
            themeSelect.value = this.themeManager.getTheme();
        }
        
        // Sound settings
        const soundToggle = document.getElementById('sound-enabled');
        const volumeSlider = document.getElementById('sound-volume');
        
        if (soundToggle && this.typingEngine?.soundManager) {
            soundToggle.checked = this.typingEngine.soundManager.isEnabled();
        }
        
        if (volumeSlider && this.typingEngine?.soundManager) {
            volumeSlider.value = this.typingEngine.soundManager.getVolume() * 100;
        }
    }
    
    updateLeaderboard(data) {
        const leaderboardElement = document.getElementById('live-leaderboard');
        if (leaderboardElement && data.leaderboard) {
            // Update leaderboard display
            this.renderLeaderboard(data.leaderboard);
        }
    }
    
    updateOnlineUsers(data) {
        const onlineCount = document.getElementById('online-users-count');
        if (onlineCount) {
            onlineCount.textContent = data.count;
        }
    }
    
    renderLeaderboard(leaderboard) {
        const container = document.getElementById('leaderboard-list');
        if (!container) return;
        
        container.innerHTML = leaderboard.map((entry, index) => `
            <div class="flex items-center justify-between p-3 ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 dark:bg-opacity-20' : 'bg-gray-50 dark:bg-gray-800'} rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 flex items-center justify-center rounded-full ${index < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'} font-bold text-sm">
                        ${index + 1}
                    </div>
                    <div>
                        <div class="font-medium">${this.escapeHtml(entry.username)}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">${Math.round(entry.accuracy)}% accuracy</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-lg">${entry.wpm}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">WPM</div>
                </div>
            </div>
        `).join('');
    }
    
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}

// Global utilities
window.utils = {
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    },
    
    formatDate: (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};