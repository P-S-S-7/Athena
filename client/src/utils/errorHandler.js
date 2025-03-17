class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'authentication_failed');
  }
}

export class PermissionError extends ApiError {
  constructor(message = 'Permission denied') {
    super(message, 403, 'permission_denied');
  }
}

export class ResourceNotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'resource_not_found');
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed') {
    super(message, 422, 'validation_error');
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'rate_limit_exceeded');
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message = 'Service unavailable') {
    super(message, 503, 'service_unavailable');
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network error') {
    super(message, 0, 'network_error');
  }
}

export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 401:
        return new AuthenticationError(data.message || 'Authentication failed');
      case 403:
        return new PermissionError(data.message || 'Permission denied');
      case 404:
        return new ResourceNotFoundError(data.message || 'Resource not found');
      case 422:
        return new ValidationError(data.message || 'Validation failed');
      case 429:
        return new RateLimitError(data.message || 'Rate limit exceeded');
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServiceUnavailableError(data.message || 'Service unavailable');
      default:
        return new ApiError(
          data.message || 'An error occurred',
          status,
          data.error || 'api_error'
        );
    }
  } else if (error.request) {
    return new NetworkError('No response from server. Please check your connection.');
  } else {
    return new ApiError(error.message, 0, 'request_error');
  }
};

export default {
  handleApiError,
  AuthenticationError,
  PermissionError,
  ResourceNotFoundError,
  ValidationError,
  RateLimitError,
  ServiceUnavailableError,
  NetworkError,
  ApiError
};
