const User = require('../models/User');

const authController = {
    getLogin: (req, res) => {
        if (req.session && req.session.user) {
            return res.redirect('/');
        }
        
        res.render('pages/login.njk', {
            title: 'Login - TypeSpeed Pro',
            error: req.query.error
        });
    },
    
    postLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.render('pages/login.njk', {
                    title: 'Login - TypeSpeed Pro',
                    error: 'Email and password are required',
                    email
                });
            }
            
            const userId = await User.verifyPassword(email, password);
            
            if (!userId) {
                return res.render('pages/login.njk', {
                    title: 'Login - TypeSpeed Pro',
                    error: 'Invalid email or password',
                    email
                });
            }
            
            const user = await User.findById(userId);
            req.session.user = user;
            
            const redirectTo = req.session.returnTo || '/';
            delete req.session.returnTo;
            
            res.redirect(redirectTo);
            
        } catch (error) {
            console.error('Login error:', error);
            res.render('pages/login.njk', {
                title: 'Login - TypeSpeed Pro',
                error: 'An error occurred during login',
                email: req.body.email
            });
        }
    },
    
    getRegister: (req, res) => {
        if (req.session && req.session.user) {
            return res.redirect('/');
        }
        
        res.render('pages/register.njk', {
            title: 'Sign Up - TypeSpeed Pro',
            error: req.query.error
        });
    },
    
    postRegister: async (req, res) => {
        try {
            const { username, email, password, confirmPassword } = req.body;
            
            // Validation
            if (!username || !email || !password || !confirmPassword) {
                return res.render('pages/register.njk', {
                    title: 'Sign Up - TypeSpeed Pro',
                    error: 'All fields are required',
                    username,
                    email
                });
            }
            
            if (password !== confirmPassword) {
                return res.render('pages/register.njk', {
                    title: 'Sign Up - TypeSpeed Pro',
                    error: 'Passwords do not match',
                    username,
                    email
                });
            }
            
            if (password.length < 6) {
                return res.render('pages/register.njk', {
                    title: 'Sign Up - TypeSpeed Pro',
                    error: 'Password must be at least 6 characters long',
                    username,
                    email
                });
            }
            
            if (username.length < 3 || username.length > 20) {
                return res.render('pages/register.njk', {
                    title: 'Sign Up - TypeSpeed Pro',
                    error: 'Username must be between 3 and 20 characters',
                    username,
                    email
                });
            }
            
            const user = await User.create({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password
            });
            
            // Auto-login after registration
            req.session.user = user;
            res.redirect('/');
            
        } catch (error) {
            console.error('Registration error:', error);
            res.render('pages/register.njk', {
                title: 'Sign Up - TypeSpeed Pro',
                error: error.message,
                username: req.body.username,
                email: req.body.email
            });
        }
    },
    
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/');
        });
    }
};

module.exports = authController;