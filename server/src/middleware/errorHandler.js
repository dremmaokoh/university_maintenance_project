function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500 ? 'Something went wrong. Please try again.' : err.message;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;
