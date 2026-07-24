class AppError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super('VALIDATION_ERROR', message, 400);
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super('NOT_FOUND', message, 404);
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super('RATE_LIMIT_EXCEEDED', message, 429);
  }
}

class FetchError extends AppError {
  constructor(message) {
    super('FETCH_FAILED', message, 502);
  }
}

class InternalError extends AppError {
  constructor(message) {
    super('INTERNAL_ERROR', message, 500);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  FetchError,
  InternalError,
};
