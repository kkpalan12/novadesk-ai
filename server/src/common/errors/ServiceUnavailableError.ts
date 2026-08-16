import { AppError } from "./AppError";

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(503, message);
  }
}
