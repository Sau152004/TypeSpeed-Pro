

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    
    if (req.xhr || req.headers['content-type'] === 'application/json') {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    req.session.returnTo = req.originalUrl;
    res.redirect('/auth/login');
}

function optionalAuth(req, res, next) {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        res.locals.user = req.user;
    }
    next();
}

module.exports = {
    requireAuth,
    optionalAuth
};