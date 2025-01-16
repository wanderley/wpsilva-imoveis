import { inspect } from "util";

export class SystemError extends Error {
  constructor(
    message: string,
    cause?: unknown,
    metadata?: Record<string, unknown>,
  ) {
    if (cause || metadata) {
      super(message, {
        cause: { metadata, error: cause },
      });
    } else {
      super(message);
    }
  }
}

export function stringifyError(error: unknown): string {
  return inspect(error, { depth: null, colors: true });
}
