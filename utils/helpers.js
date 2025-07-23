const crypto = require('crypto');

class Helpers {
    // Date and time utilities
    static formatDate(date, format = 'short') {
        const d = new Date(date);
        
        const formats = {
            short: d.toLocaleDateString(),
            long: d.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            time: d.toLocaleTimeString(),
            datetime: d.toLocaleString(),
            iso: d.toISOString(),
            relative: this.getRelativeTime(d)
        };
        
        return formats[format] || formats.short;
    }
    
    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        
        return this.formatDate(date, 'short');
    }
    
    static formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        if (mins === 0) return `${secs}s`;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Number utilities
    static formatNumber(num, decimals = 0) {
        return Number(num).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    static formatPercent(num, decimals = 1) {
        return `${Number(num).toFixed(decimals)}%`;
    }
    
    static clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }
    
    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static roundToDecimal(num, decimals) {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    
    // String utilities
    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    static capitalizeWords(str) {
        return str.replace(/\w\S*/g, txt => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
    
    static slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
    
    static truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }
    
    static generateRandomString(length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }
    
    // Array utilities
    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    static chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    static unique(array) {
        return [...new Set(array)];
    }
    
    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }
    
    // Object utilities
    static pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (key in obj) result[key] = obj[key];
        });
        return result;
    }
    
    static omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }
    
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    static isEmpty(obj) {
        return obj === null || 
               obj === undefined || 
               (Array.isArray(obj) && obj.length === 0) ||
               (typeof obj === 'object' && Object.keys(obj).length === 0);
    }
    
    // Validation utilities
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    // Security utilities
    static generateHash(data, algorithm = 'sha256') {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }
    
    static generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    
    static generateUUID() {
        return crypto.randomUUID();
    }
    
    // Performance utilities
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static throttle(func, limit) {
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
    
    static memoize(func) {
        const cache = new Map();
        return function(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }
    
    // File utilities
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }
    
    static formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Color utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    // Error handling utilities
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    
    static createError(message, statusCode = 500, code = null) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.status = statusCode;
        if (code) error.code = code;
        return error;
    }
    
    // API response utilities
    static successResponse(data, message = 'Success') {
        return {
            success: true,
            message,
            data
        };
    }
    
    static errorResponse(message, code = null) {
        return {
            success: false,
            message,
            ...(code && { code })
        };
    }
    
    // Pagination utilities
    static getPaginationInfo(page, limit, total) {
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        const offset = (page - 1) * limit;
        
        return {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext,
            hasPrev,
            offset,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null
        };
    }
    
    // Environment utilities
    static isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }
    
    static isProduction() {
        return process.env.NODE_ENV === 'production';
    }
    
    static isTest() {
        return process.env.NODE_ENV === 'test';
    }
    
    // Logging utilities
    static log(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };
        
        if (this.isDevelopment()) {
            console.log(JSON.stringify(logEntry, null, 2));
        } else {
            console.log(JSON.stringify(logEntry));
        }
    }
    
    static logError(error, context = {}) {
        this.log('error', error.message, {
            stack: error.stack,
            ...context
        });
    }
    
    // Rate limiting utilities
    static createRateLimiter(windowMs, max) {
        const requests = new Map();
        
        return (identifier) => {
            const now = Date.now();
            const windowStart = now - windowMs;
            
            // Clean old entries
            for (const [key, timestamps] of requests.entries()) {
                const validTimestamps = timestamps.filter(t => t > windowStart);
                if (validTimestamps.length === 0) {
                    requests.delete(key);
                } else {
                    requests.set(key, validTimestamps);
                }
            }
            
            // Check current user
            const userRequests = requests.get(identifier) || [];
            const recentRequests = userRequests.filter(t => t > windowStart);
            
            if (recentRequests.length >= max) {
                return { allowed: false, retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000) };
            }
            
            recentRequests.push(now);
            requests.set(identifier, recentRequests);
            
            return { allowed: true, remaining: max - recentRequests.length };
        };
    }
}

module.exports = Helpers;