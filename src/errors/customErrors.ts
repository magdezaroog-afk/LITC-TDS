export class ApplicationError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedTransitionError extends ApplicationError {
  constructor(message: string = 'Unauthorized ticket state transition for this role.') {
    super(message, 403);
  }
}

export class ConcurrencyConflictError extends ApplicationError {
  constructor(message: string = 'Concurrency Conflict: The ticket has been updated by another process.') {
    super(message, 409);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 404);
  }
}
