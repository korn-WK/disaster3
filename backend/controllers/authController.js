const User = require('../models/User');
const jwt = require('jsonwebtoken');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const crypto = require('crypto');

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

// Helper function to generate refresh token
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

// Helper function to set cookies
function setAuthCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Set access token cookie (short-lived, 15 minutes)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  });
  
  // Set refresh token cookie (longer-lived, 7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction, // Only send over HTTPS in production
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
}

// Helper function to clear cookies
function clearAuthCookies(res) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

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
  
  handleCallback: async (req, res) => {
    try {
      if (!req.user) {
        console.error('No user found in request');
        const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        return res.redirect(`${frontendUrl.origin}/login?error=no_user`);
      }
      
      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: req.user._id, 
          email: req.user.email, 
          name: req.user.name,
          role: req.user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived access token
      );
      
      const refreshToken = generateRefreshToken();
      
      // Save refresh token to database
      req.user.refreshToken = refreshToken;
      await req.user.save();
      
      // Set cookies
      setAuthCookies(res, accessToken, refreshToken);
      
      // Debug logging
      console.log('User authenticated successfully:', req.user.email);
      console.log('User role:', req.user.role);
      
      // Redirect to frontend without token in URL
      const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      const redirectUrl = req.user.role === 'admin' 
        ? `${frontendUrl.origin}/admin`
        : `${frontendUrl.origin}/user`;
      
      console.log('Redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in handleCallback:', error);
      const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      res.redirect(`${frontendUrl.origin}/login?error=token_error`);
    }
  },
  
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
      }
      
      // Find user by refresh token
      const user = await User.findOne({ refreshToken });
      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      
      // Generate new access token
      const accessToken = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          name: user.name,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      
      // Set new access token cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/'
      });
      
      res.json({ 
        message: 'Token refreshed successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.cookies;
      
      if (refreshToken) {
        // Remove refresh token from database
        await User.findOneAndUpdate(
          { refreshToken },
          { $unset: { refreshToken: 1 } }
        );
      }
      
      // Clear cookies
      clearAuthCookies(res);
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select('-__v -refreshToken');
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