const { body, query, param } = require('express-validator');

// User registration validation
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

// User login validation
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required')
];

// Test result validation
const testResultValidation = [
    body('wpm')
        .isInt({ min: 0, max: 300 })
        .withMessage('WPM must be between 0 and 300'),
    body('rawWpm')
        .isInt({ min: 0, max: 500 })
        .withMessage('Raw WPM must be between 0 and 500'),
    body('accuracy')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Accuracy must be between 0 and 100'),
    body('time')
        .isInt({ min: 1, max: 3600 })
        .withMessage('Time must be between 1 and 3600 seconds'),
    body('correctChars')
        .isInt({ min: 0 })
        .withMessage('Correct characters must be a positive number'),
    body('incorrectChars')
        .isInt({ min: 0 })
        .withMessage('Incorrect characters must be a positive number'),
    body('totalChars')
        .isInt({ min: 1 })
        .withMessage('Total characters must be at least 1'),
    body('errors')
        .isInt({ min: 0 })
        .withMessage('Errors must be a positive number'),
    body('testMode')
        .isIn(['time', 'words', 'quote', 'custom'])
        .withMessage('Invalid test mode'),
    body('testConfig')
        .isObject()
        .withMessage('Test config must be an object'),
    body('text')
        .isLength({ min: 1, max: 10000 })
        .withMessage('Text must be between 1 and 10000 characters')
];

// User settings validation
const settingsValidation = [
    body('theme')
        .optional()
        .isIn(['light', 'dark'])
        .withMessage('Theme must be light or dark'),
    body('soundEnabled')
        .optional()
        .isBoolean()
        .withMessage('Sound enabled must be a boolean'),
    body('soundVolume')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Sound volume must be between 0 and 1'),
    body('fontFamily')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Font family must be between 1 and 50 characters'),
    body('fontSize')
        .optional()
        .isInt({ min: 12, max: 32 })
        .withMessage('Font size must be between 12 and 32'),
    body('showLiveWpm')
        .optional()
        .isBoolean()
        .withMessage('Show live WPM must be a boolean'),
    body('showLiveAccuracy')
        .optional()
        .isBoolean()
        .withMessage('Show live accuracy must be a boolean')
];

// Profile update validation
const profileValidation = [
    body('username')
        .optional()
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address')
];

// Password change validation
const passwordChangeValidation = [
    body('currentPassword')
        .isLength({ min: 1 })
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number'),
    body('confirmNewPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('New passwords do not match');
            }
            return true;
        })
];

// Query parameter validation
const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

// Timeframe validation
const timeframeValidation = [
    query('timeframe')
        .optional()
        .isIn(['today', 'week', 'month', 'year', 'all'])
        .withMessage('Timeframe must be one of: today, week, month, year, all')
];

// ID parameter validation
const idValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer')
];

// Text generation validation
const textGenerationValidation = [
    query('duration')
        .optional()
        .isInt({ min: 5, max: 300 })
        .withMessage('Duration must be between 5 and 300 seconds'),
    query('count')
        .optional()
        .isInt({ min: 10, max: 500 })
        .withMessage('Word count must be between 10 and 500')
];

// Custom validation helper functions
const sanitizeInput = (req, res, next) => {
    // Remove any HTML tags from input fields
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
};

const rateLimitByUser = (req, res, next) => {
    // Additional rate limiting based on user ID
    if (req.user) {
        const key = `rate_limit_${req.user.id}`;
        // Implementation would depend on your rate limiting strategy
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    testResultValidation,
    settingsValidation,
    profileValidation,
    passwordChangeValidation,
    paginationValidation,
    timeframeValidation,
    idValidation,
    textGenerationValidation,
    sanitizeInput,
    rateLimitByUser
};