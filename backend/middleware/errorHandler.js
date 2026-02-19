const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // M1: CastError means an invalid MongoDB ObjectId was passed — treat as 404
  // This prevents leaking that we use MongoDB and avoids misleading 500 responses
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    err.message = 'Resource not found';
  }

  res.status(statusCode);

  // L3: Always include success:false to maintain response envelope contract
  // H4: Stack traces only in development — never in production or staging
  res.json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { errorHandler };
