const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    // Default error status
    let status = err.status || err.statusCode || 500;
    let message = 'Internal server error';
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation error';
    } else if (err.name === 'CastError') {
        status = 400;
        message = 'Invalid data format';
    } else if (err.code === 11000) {
        status = 400;
        message = 'Duplicate field value';
    } else if (err.name === 'JsonWebTokenError') {
        status = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Token expired';
    } else if (err.code === '23505') { // PostgreSQL unique violation
        status = 400;
        message = 'Duplicate entry';
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
        status = 400;
        message = 'Referenced record not found';
    } else if (err.code === '23502') { // PostgreSQL not null violation
        status = 400;
        message = 'Required field missing';
    }
    
    // In development, show full error details
    if (req.app.get('env') === 'development') {
        message = err.message || message;
    }
    
    // Send error response
    if (req.xhr || req.headers['content-type'] === 'application/json' || req.path.startsWith('/api/')) {
        res.status(status).json({
            success: false,
            message: message,
            ...(req.app.get('env') === 'development' && { stack: err.stack })
        });
    } else {
        // Render error page for HTML requests
        if (status === 404) {
            res.status(404).render('error/404.njk', {
                title: 'Page Not Found - TypeSpeed Pro',
                message: 'The page you are looking for does not exist.'
            });
        } else {
            res.status(status).render('error/500.njk', {
                title: 'Server Error - TypeSpeed Pro',
                message: message
            });
        }
    }
};

// 404 handler for routes that don't exist
const notFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler
};