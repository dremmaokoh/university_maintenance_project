function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = err.statusCode || 500;
  let message =
    statusCode >= 500 ? 'Something went wrong. Please try again.' : err.message;

  if (err.code === 11000) {
    statusCode = 409;
    message =
      'This record conflicts with existing data. Restart the API after upgrading, or run: node src/scripts/resetDatabase.js --confirm';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;
