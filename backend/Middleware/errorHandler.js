class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const responsePayload = {
    success: false,
    message: err.message || "Internal server error",
  };

  if (err.details) {
    responsePayload.details = err.details;
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    responsePayload.stack = err.stack;
  }

  console.error("[Error]", {
    message: err.message,
    statusCode,
    stack: err.stack,
    details: err.details,
  });

  return res.status(statusCode).json(responsePayload);
};

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

module.exports = {
  errorHandler,
  notFoundHandler,
  ApiError,
};
