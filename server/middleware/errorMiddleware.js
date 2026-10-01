/**
 * Global Production Error Handling Middleware & Custom ApiError for FoodLink
 */

export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 404 Handler for undefined routes
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Resource Not Found - ${req.originalUrl}`);
  next(error);
};

// Global Error Handler
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate field value entered for ${field}. Please use another value.`;
    statusCode = 400;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    statusCode = 400;
  }

  // Handle JWT Invalid Signature
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authorization token. Please log in again.';
    statusCode = 401;
  }

  // Handle JWT Token Expired
  if (err.name === 'TokenExpiredError') {
    message = 'Authorization token expired. Please log in again.';
    statusCode = 401;
  }

  console.error(`❌ [${req.method}] ${req.originalUrl} - Error: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
