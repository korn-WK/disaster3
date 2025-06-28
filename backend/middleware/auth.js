const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Get token from cookies instead of header
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ message: 'No access token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth; 