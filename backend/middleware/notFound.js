const notFound = (req, res, next) => {
  // H3: Generic message — do NOT reflect req.originalUrl (leaks internal routing structure)
  const error = new Error('The requested resource was not found');
  res.status(404);
  next(error);
};

module.exports = { notFound };
