/**
 * Structured logging system for Stafferoo
 * 
 * Philosophy: "Observability first" - CLAUDE.md
 * - All events logged with context
 * - Errors sent to console (for now, upgrade to Sentry/Langfuse later)
 * - Audit events for compliance
 * - Performance tracking
 * 
 * Strategy:
 * - Console logs for development
 * - Vercel Logs for production (zero config)
 * - Audit table for compliance events
 * - Upgrade path: Sentry for errors, Langfuse for AI, PostHog for analytics
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

export interface LogContext {
  [key: string]: unknown;
  userId?: string;
  email?: string;
  requestId?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  service: string;
  version: string;
}

// Service identification
const SERVICE = 'stafferoo-web';
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

// Feature flags for logging
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

/**
 * Core logging function - structured JSON for Vercel ingestion
 */
function log(level: LogLevel, message: string, context: LogContext = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: sanitizeContext(context),
    service: SERVICE,
    version: VERSION,
  };

  // In production, Vercel automatically captures console output
  // Structured JSON makes it searchable
  if (isProd) {
    // Use console.log for structured output (Vercel captures this)
    console.log(JSON.stringify(entry));
  } else {
    // Development: human readable
    const color = getColor(level);
    const prefix = `[${entry.timestamp}] ${level.toUpperCase()}`;
    
    if (level === 'error') {
      console.error(color, prefix, message, context);
    } else if (level === 'warn') {
      console.warn(color, prefix, message, context);
    } else {
      console.log(color, prefix, message, context);
    }
  }
}

/**
 * Sanitize context to remove sensitive data
 */
function sanitizeContext(context: LogContext): LogContext {
  const sanitized = { ...context };
  
  // Never log these fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function getColor(level: LogLevel): string {
  switch (level) {
    case 'error': return '\x1b[31m'; // Red
    case 'warn': return '\x1b[33m';  // Yellow
    case 'audit': return '\x1b[35m'; // Magenta
    case 'debug': return '\x1b[36m'; // Cyan
    default: return '\x1b[32m';      // Green
  }
}

// Public API
export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (isDev) log('debug', message, context);
  },
  
  info: (message: string, context?: LogContext) => {
    log('info', message, context);
  },
  
  warn: (message: string, context?: LogContext) => {
    log('warn', message, context);
  },
  
  error: (message: string, error: unknown, context?: LogContext) => {
    const errorContext: LogContext = {
      ...context,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    };
    log('error', message, errorContext);
  },
  
  // Audit logs for compliance (who did what, when)
  audit: (action: string, entityType: string, entityId: string, context?: LogContext) => {
    log('audit', `AUDIT: ${action}`, {
      ...context,
      auditAction: action,
      auditEntityType: entityType,
      auditEntityId: entityId,
    });
  },

  // Performance tracking
  perf: (operation: string, durationMs: number, context?: LogContext) => {
    log('info', `PERF: ${operation} took ${durationMs}ms`, {
      ...context,
      perfOperation: operation,
      perfDurationMs: durationMs,
    });
  },

  // Security events
  security: (event: string, context?: LogContext) => {
    log('warn', `SECURITY: ${event}`, {
      ...context,
      securityEvent: event,
    });
  },
};

/**
 * Request logging wrapper for API routes
 */
export function logRequest(
  request: Request,
  requestId: string
): { startTime: number; requestId: string } {
  const startTime = Date.now();
  
  logger.info('API Request started', {
    requestId,
    method: request.method,
    path: new URL(request.url).pathname,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  return { startTime, requestId };
}

export function logResponse(
  requestId: string,
  startTime: number,
  statusCode: number,
  context?: LogContext
): void {
  const duration = Date.now() - startTime;
  
  logger.info('API Request completed', {
    requestId,
    statusCode,
    durationMs: duration,
    ...context,
  });
}
