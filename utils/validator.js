class Validator {
    static isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static isValidUsername(username) {
        // Username: 3-20 characters, alphanumeric and underscores only
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }
    
    static isStrongPassword(password) {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove HTML tags and dangerous characters
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
    }
    
    static validateTestResult(result) {
        const errors = [];
        
        // WPM validation
        if (!result.wpm || result.wpm < 0 || result.wpm > 300) {
            errors.push('WPM must be between 0 and 300');
        }
        
        // Raw WPM validation
        if (!result.rawWpm || result.rawWpm < 0 || result.rawWpm > 500) {
            errors.push('Raw WPM must be between 0 and 500');
        }
        
        // Accuracy validation
        if (result.accuracy === undefined || result.accuracy < 0 || result.accuracy > 100) {
            errors.push('Accuracy must be between 0 and 100');
        }
        
        // Time validation
        if (!result.time || result.time < 1 || result.time > 3600) {
            errors.push('Time must be between 1 and 3600 seconds');
        }
        
        // Character counts validation
        if (result.correctChars < 0 || result.incorrectChars < 0) {
            errors.push('Character counts cannot be negative');
        }
        
        if (result.correctChars + result.incorrectChars !== result.totalChars) {
            errors.push('Character counts do not add up correctly');
        }
        
        // Test mode validation
        const validModes = ['time', 'words', 'quote', 'custom'];
        if (!validModes.includes(result.testMode)) {
            errors.push('Invalid test mode');
        }
        
        // Text validation
        if (!result.text || result.text.length < 1 || result.text.length > 10000) {
            errors.push('Text must be between 1 and 10000 characters');
        }
        
        // Realistic performance check
        if (result.wpm > 200 && result.accuracy > 95) {
            errors.push('Performance appears unrealistic');
        }
        
        return errors;
    }
    
    static validateUserSettings(settings) {
        const errors = [];
        
        // Theme validation
        if (settings.theme && !['light', 'dark'].includes(settings.theme)) {
            errors.push('Theme must be light or dark');
        }
        
        // Sound volume validation
        if (settings.soundVolume !== undefined && (settings.soundVolume < 0 || settings.soundVolume > 1)) {
            errors.push('Sound volume must be between 0 and 1');
        }
        
        // Font size validation
        if (settings.fontSize !== undefined && (settings.fontSize < 12 || settings.fontSize > 32)) {
            errors.push('Font size must be between 12 and 32');
        }
        
        // Font family validation
        if (settings.fontFamily && (settings.fontFamily.length < 1 || settings.fontFamily.length > 50)) {
            errors.push('Font family name must be between 1 and 50 characters');
        }
        
        return errors;
    }
    
    static validatePagination(page, limit) {
        const errors = [];
        
        if (page && (page < 1 || page > 1000)) {
            errors.push('Page must be between 1 and 1000');
        }
        
        if (limit && (limit < 1 || limit > 100)) {
            errors.push('Limit must be between 1 and 100');
        }
        
        return errors;
    }
    
    static validateTimeframe(timeframe) {
        const validTimeframes = ['today', 'week', 'month', 'year', 'all'];
        return validTimeframes.includes(timeframe);
    }
    
    static isValidId(id) {
        return Number.isInteger(Number(id)) && Number(id) > 0;
    }
    
    static validateTextGeneration(options) {
        const errors = [];
        
        if (options.duration && (options.duration < 5 || options.duration > 300)) {
            errors.push('Duration must be between 5 and 300 seconds');
        }
        
        if (options.count && (options.count < 10 || options.count > 500)) {
            errors.push('Word count must be between 10 and 500');
        }
        
        return errors;
    }
    
    static sanitizeAndValidateText(text) {
        if (!text || typeof text !== 'string') {
            return { isValid: false, error: 'Text is required and must be a string' };
        }
        
        // Remove dangerous content
        const sanitized = this.sanitizeInput(text);
        
        // Check length
        if (sanitized.length < 1) {
            return { isValid: false, error: 'Text cannot be empty' };
        }
        
        if (sanitized.length > 10000) {
            return { isValid: false, error: 'Text is too long (max 10000 characters)' };
        }
        
        // Check for reasonable content
        const wordCount = sanitized.split(/\s+/).length;
        if (wordCount < 3) {
            return { isValid: false, error: 'Text must contain at least 3 words' };
        }
        
        return { isValid: true, sanitizedText: sanitized };
    }
    
    static getPasswordStrength(password) {
        let score = 0;
        const feedback = [];
        
        // Length check
        if (password.length >= 8) score += 1;
        else feedback.push('Use at least 8 characters');
        
        if (password.length >= 12) score += 1;
        
        // Character variety
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Include lowercase letters');
        
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Include uppercase letters');
        
        if (/\d/.test(password)) score += 1;
        else feedback.push('Include numbers');
        
        if (/[^a-zA-Z\d]/.test(password)) score += 1;
        else feedback.push('Include special characters');
        
        // Common patterns
        if (!/(.)\1{2,}/.test(password)) score += 1;
        else feedback.push('Avoid repeating characters');
        
        const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][Math.min(score, 5)];
        
        return {
            score,
            strength,
            feedback,
            isAcceptable: score >= 4
        };
    }
    
    static validateRegistrationData(data) {
        const errors = {};
        
        // Username validation
        if (!data.username) {
            errors.username = 'Username is required';
        } else if (!this.isValidUsername(data.username)) {
            errors.username = 'Username must be 3-20 characters, letters, numbers, and underscores only';
        }
        
        // Email validation
        if (!data.email) {
            errors.email = 'Email is required';
        } else if (!this.isEmail(data.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        // Password validation
        if (!data.password) {
            errors.password = 'Password is required';
        } else {
            const passwordCheck = this.getPasswordStrength(data.password);
            if (!passwordCheck.isAcceptable) {
                errors.password = passwordCheck.feedback.join(', ');
            }
        }
        
        // Confirm password validation
        if (data.password !== data.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    static validateLoginData(data) {
        const errors = {};
        
        if (!data.email) {
            errors.email = 'Email is required';
        } else if (!this.isEmail(data.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!data.password) {
            errors.password = 'Password is required';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, (match) => map[match]);
    }
    
    static validateApiKey(apiKey) {
        // Basic API key validation
        return apiKey && 
               typeof apiKey === 'string' && 
               apiKey.length >= 20 && 
               /^[a-zA-Z0-9_-]+$/.test(apiKey);
    }
    
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    static validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        const errors = [];
        
        if (!file) {
            errors.push('No file provided');
            return { isValid: false, errors };
        }
        
        // Size validation
        if (file.size > maxSize) {
            errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        }
        
        // Type validation
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
            errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = Validator;