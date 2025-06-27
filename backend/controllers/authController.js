const User = require('../models/User');
const jwt = require('jsonwebtoken');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');

// Configure Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, cb) => {
  try {
    console.log('Google OAuth callback received for profile:', profile.id);
    console.log('Profile email:', profile.emails[0]?.value);
    
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      console.log('Existing user found:', user.email);
      user.lastLogin = new Date();
      await user.save();
      return cb(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0]?.value,
      role: 'user' // Default role
    });
    await user.save();
    console.log('New user created:', user.email);
    return cb(null, user);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return cb(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const authController = {
  googleAuth: passport.authenticate('google', { 
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  }),
  
  googleCallback: passport.authenticate('google', { 
    failureRedirect: '/login?error=google_auth_failed', 
    session: false 
  }),
  
  handleCallback: (req, res) => {
    try {
      if (!req.user) {
        console.error('No user found in request');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_user`);
      }
      
      const token = jwt.sign(
        { 
          userId: req.user._id, 
          email: req.user.email, 
          name: req.user.name,
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Debug logging
      console.log('User authenticated successfully:', req.user.email);
      console.log('User role:', req.user.role);
      console.log('FRONTEND_URL from env:', process.env.FRONTEND_URL);
      
      // Ensure the frontend URL is properly set
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrl = `${frontendUrl}/auth/callback?token=${token}`;
      
      console.log('Redirecting to:', callbackUrl);
      
      res.redirect(callbackUrl);
    } catch (error) {
      console.error('Error in handleCallback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=token_error`);
    }
  },
  
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select('-__v');
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Test endpoint to check if OAuth is configured
  testOAuth: (req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Configured' : 'Not configured',
      frontendUrl: process.env.FRONTEND_URL || 'Not configured',
      jwtSecret: process.env.JWT_SECRET ? 'Configured' : 'Not configured'
    });
  }
};

module.exports = { authController, passport }; 