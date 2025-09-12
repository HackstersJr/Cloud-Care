import { AppError, ValidationError, UnauthorizedError } from '../../src/middleware/errorHandler';

describe('Error Handler Classes', () => {
  describe('AppError', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create an error with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_ERROR', { field: 'test' });
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual({ field: 'test' });
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an unauthorized error with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create an unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Custom unauthorized message');
      
      expect(error.message).toBe('Custom unauthorized message');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });
});
