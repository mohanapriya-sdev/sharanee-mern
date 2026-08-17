const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT and attaches req.user
const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};



// Optional authentication
// If token exists and is valid -> attaches req.user
// If no token -> continues as guest
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;

  // No token = guest user, continue normally
  if (!header || !header.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  try {
    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = await User.findById(decoded.id);

    return next();
  } catch (error) {
    // Invalid/expired token should not block public contact form
    req.user = null;
    return next();
  }
};


// Restricts a route to admin users only. Use after `protect`.
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
};

module.exports = {
  protect,
  optionalAuth,
  admin,
};
