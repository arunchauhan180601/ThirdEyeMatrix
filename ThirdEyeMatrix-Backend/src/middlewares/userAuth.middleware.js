const jwt = require('jsonwebtoken');

exports.userAuthMiddleware = (req, res, next) => {
  let token;

  // 1️⃣ Check Authorization header first
  if (req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '');
  }

  // 2️⃣ If no token in header, check query string (for redirects)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // or decoded if your JWT has user object
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
