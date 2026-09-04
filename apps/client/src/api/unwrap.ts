/**
 * `openapi-fetch` resolves with `{ data, error, response }` for every outcome, including
 * failures. React Query needs a rejected promise to mark a query as errored, so every read
 * goes through here.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Never retry a refusal the server will repeat: only transport faults and 5xx are worth another go. */
export function shouldRetry(failures: number, error: unknown): boolean {
  if (failures >= 1) return false;
  if (!(error instanceof ApiError)) return true;
  return error.status >= 500;
}

type Result<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

export function unwrap<T>({ data, error, response }: Result<T>): T {
  if (data !== undefined) return data;
  throw new ApiError(response.status, refusalMessage(error, response.status));
}

function refusalMessage(error: unknown, status: number): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return `Request failed with ${status}.`;
}
