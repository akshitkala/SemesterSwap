const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Forbidden: Requires one of the following roles: ${roles.join(', ')}`);
    }
    next();
  };
};

module.exports = { requireRole };
