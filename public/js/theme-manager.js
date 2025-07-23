class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        this.bindEvents();
    }
    
    bindEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
    }
    
    applyTheme() {
        const html = document.documentElement;
        
        if (this.currentTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        
        // Update theme color meta tag
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.content = this.currentTheme === 'dark' ? '#0f172a' : '#ffffff';
        }
    }
    
    saveTheme() {
        localStorage.setItem('theme', this.currentTheme);
        
        // Send to server if user is logged in
        if (window.user) {
            fetch('/api/user/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ theme: this.currentTheme })
            }).catch(err => console.warn('Failed to save theme preference:', err));
        }
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme();
        this.saveTheme();
    }
    
    getTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});