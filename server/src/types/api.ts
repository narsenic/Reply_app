export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string>;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, string>;

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ApiError {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}
