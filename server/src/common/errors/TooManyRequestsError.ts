import { AppError } from "./AppError";

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(429, message);
  }
}
