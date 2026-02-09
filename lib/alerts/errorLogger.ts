/**
 * Discord Alert Utility for Web Dashboard
 * 
 * Client-side error logging and monitoring
 * Note: Discord webhooks are sent from the server-side API
 */

export interface ErrorAlert {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    metadata?: Record<string, unknown>;
}

/**
 * Log error to console and optionally send to API for Discord notification
 * @param alert - Error alert details
 */
export function logError(alert: ErrorAlert): void {
    const timestamp = new Date().toISOString();

    // In production, you could send this to your API for server-side Discord alerts
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        // Optionally send to backend for centralized logging
        fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...alert,
                timestamp,
                userAgent: navigator.userAgent,
                url: window.location.href,
            }),
        }).catch(() => undefined);
    }
}

/**
 * Log API error
 */
export function logApiError(endpoint: string, statusCode: number, error: unknown): void {
    logError({
        title: 'API Error',
        message: `Request to ${endpoint} failed with status ${statusCode}`,
        severity: statusCode >= 500 ? 'critical' : 'warning',
        metadata: {
            endpoint,
            statusCode,
            error: error instanceof Error ? error.message : String(error),
        },
    });
}

/**
 * Log authentication error
 */
export function logAuthError(error: unknown): void {
    logError({
        title: 'Authentication Error',
        message: 'User authentication failed',
        severity: 'warning',
        metadata: {
            error: error instanceof Error ? error.message : String(error),
        },
    });
}

/**
 * Log network error
 */
export function logNetworkError(operation: string, error: unknown): void {
    logError({
        title: 'Network Error',
        message: `Network operation '${operation}' failed`,
        severity: 'warning',
        metadata: {
            operation,
            error: error instanceof Error ? error.message : String(error),
        },
    });
}

/**
 * Global error handler for uncaught errors
 * Call this in your root layout or app component
 */
export function setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        logError({
            title: 'Uncaught Error',
            message: event.message || 'An uncaught error occurred',
            severity: 'critical',
            metadata: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error ? event.error.toString() : undefined,
            },
        });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        logError({
            title: 'Unhandled Promise Rejection',
            message: 'An unhandled promise rejection occurred',
            severity: 'critical',
            metadata: {
                reason: event.reason ? event.reason.toString() : 'Unknown',
            },
        });
    });
}

/**
 * React Error Boundary compatible error logger
 */
export function logReactError(error: Error, errorInfo: { componentStack: string }): void {
    logError({
        title: 'React Error',
        message: error.message || 'A React component error occurred',
        severity: 'critical',
        metadata: {
            error: error.toString(),
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        },
    });
}

const errorLogger = {
    logError,
    logApiError,
    logAuthError,
    logNetworkError,
    setupGlobalErrorHandlers,
    logReactError,
};

export default errorLogger;
