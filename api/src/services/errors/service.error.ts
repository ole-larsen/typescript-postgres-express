// Error object used in error handling middleware function
export class ServiceError extends Error{
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    Error.captureStackTrace(this);
  }
}

