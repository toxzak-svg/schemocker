import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { log } from '../utils/logger';

export interface MiddlewareOptions {
    cors?: boolean;
    hideBranding?: boolean;
    logLevel?: string;
    version: string;
}

/**
 * Setup CORS middleware
 */
export function setupCors(app: Application, enabled: boolean): void {
    if (enabled) {
        app.use(cors());
        log.debug('CORS enabled', { module: 'server' });
    }
}

/**
 * Setup JSON body parser with size limit
 */
export function setupJsonParser(app: Application): void {
    app.use(express.json({ limit: '10mb' }));
}

/**
 * Setup branding headers middleware
 */
export function setupBrandingHeaders(app: Application, options: MiddlewareOptions): void {
    if (!options.hideBranding) {
        app.use((req: Request, res: Response, next: NextFunction) => {
            res.setHeader('X-Powered-By', `Schemock v${options.version}`);
            next();
        });
        log.debug('Branding enabled', { module: 'server' });
    }
}

/**
 * Setup request logging middleware
 */
export function setupRequestLogging(app: Application): void {
    app.use((req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Log request
        log.debug(`Incoming request`, {
            module: 'server',
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip
        });

        // Override res.json to capture status code and timing
        const originalJson = res.json.bind(res);
        res.json = function (body: unknown) {
            const duration = Date.now() - startTime;
            log.request(req.method, req.path, res.statusCode, duration);
            return originalJson(body);
        };

        next();
    });
}

/**
 * Setup error handling middleware
 */
export function setupErrorHandler(app: Application, logLevel?: string): void {
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        log.error('Request error', {
            module: 'server',
            error: err,
            method: req.method,
            path: req.path
        });

        res.status(500).json({
            error: 'Internal Server Error',
            message: logLevel === 'debug' ? err.message : 'An error occurred'
        });
    });
}

/**
 * Setup all middleware for the application
 */
export function setupAllMiddleware(app: Application, options: MiddlewareOptions): void {
    setupCors(app, options.cors ?? false);
    setupJsonParser(app);
    setupBrandingHeaders(app, options);
    setupRequestLogging(app);
    setupErrorHandler(app, options.logLevel);
}
