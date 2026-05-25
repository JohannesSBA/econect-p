import { randomUUID } from "crypto";

type Level = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

export interface Logger {
  requestId: string;
  context?: LogMeta;
  log: (level: Level, message: string, meta?: LogMeta) => void;
  debug: (message: string, meta?: LogMeta) => void;
  info: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  error: (message: string, meta?: LogMeta) => void;
  child: (meta: LogMeta) => Logger;
}

function emit(level: Level, payload: LogMeta) {
  const entry = JSON.stringify({
    level,
    ...payload,
    timestamp: new Date().toISOString(),
  });
  if (level === "error" || level === "warn") {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

export function createLogger(base?: { requestId?: string; context?: LogMeta }): Logger {
  const requestId = base?.requestId ?? randomUUID();
  const context = base?.context ?? {};

  const log = (level: Level, message: string, meta?: LogMeta) => {
    emit(level, { message, requestId, ...context, ...(meta ?? {}) });
  };

  const child = (meta: LogMeta): Logger =>
    createLogger({ requestId, context: { ...context, ...meta } });

  return {
    requestId,
    context,
    log,
    debug: (message, meta) => log("debug", message, meta),
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
    child,
  };
}

export function getRequestLogger(req?: { headers?: Headers | Record<string, string> }, context?: LogMeta) {
  const headers = req?.headers;
  const requestId =
    (headers instanceof Headers
      ? headers.get("x-request-id")
      : typeof headers === "object"
        ? (headers as Record<string, string>)["x-request-id"]
        : null) ?? undefined;
  return createLogger({ requestId, context });
}

export async function traceDb<T>(
  logger: Logger,
  label: string,
  fn: () => Promise<T>,
  meta?: LogMeta,
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const durationMs = Date.now() - start;
    logger.debug("db.query", { label, durationMs, ...(meta ?? {}) });
  }
}
