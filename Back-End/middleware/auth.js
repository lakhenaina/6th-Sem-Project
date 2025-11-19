// middleware/auth.js

export function verifyToken(req, res, next) {
  // For now, just allow everything
  next();
}
