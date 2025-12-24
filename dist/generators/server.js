"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerGenerator = void 0;
exports.createMockServer = createMockServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const schema_1 = require("../parsers/schema");
const errors_1 = require("../errors");
const logger_1 = require("../utils/logger");
class ServerGenerator {
    constructor(config) {
        this.server = null;
        this.config = config;
        this.app = (0, express_1.default)();
        this.parser = new schema_1.SchemaParser();
        // Set log level from config
        if (config.server.logLevel) {
            (0, logger_1.setLogLevel)(config.server.logLevel);
        }
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Enable CORS if configured
        if (this.config.server.cors) {
            this.app.use((0, cors_1.default)());
            logger_1.log.debug('CORS enabled', { module: 'server' });
        }
        // JSON body parsing with size limit for security
        this.app.use(express_1.default.json({ limit: '10mb' }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            // Log request
            logger_1.log.debug(`Incoming request`, {
                module: 'server',
                method: req.method,
                path: req.path,
                query: req.query,
                ip: req.ip
            });
            // Override res.json to capture status code and timing
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                const duration = Date.now() - startTime;
                logger_1.log.request(req.method, req.path, res.statusCode, duration);
                return originalJson(body);
            };
            next();
        });
        // Error handling middleware
        this.app.use((err, req, res, next) => {
            logger_1.log.error('Request error', {
                module: 'server',
                error: err,
                method: req.method,
                path: req.path
            });
            res.status(500).json({
                error: 'Internal Server Error',
                message: this.config.server.logLevel === 'debug' ? err.message : 'An error occurred'
            });
        });
    }
    setupRoutes() {
        // Setup each route from the config
        Object.entries(this.config.routes).forEach(([_, routeConfig]) => {
            this.setupRoute(routeConfig);
        });
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        // 404 handler
        this.app.use((req, res) => {
            logger_1.log.warn('Route not found', {
                module: 'server',
                method: req.method,
                path: req.path
            });
            res.status(404).json({
                error: 'Not Found',
                message: `No route found for ${req.method} ${req.path}`
            });
        });
    }
    setupRoute(routeConfig) {
        const { path, method, response, statusCode = 200, delay = 0, headers = {} } = routeConfig;
        const routeHandler = async (req, res, next) => {
            const startTime = Date.now();
            try {
                // Apply delay if specified
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                // Set response headers
                Object.entries(headers).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                // Handle different response types
                if (typeof response === 'function') {
                    // If response is a function, call it with the request
                    const result = await Promise.resolve(response(req));
                    res.status(statusCode).json(result);
                }
                else if (typeof response === 'object' && response !== null) {
                    // If response is an object, use it directly
                    res.status(statusCode).json(response);
                }
                else {
                    // For other types, send as is
                    res.status(statusCode).send(response);
                }
                const duration = Date.now() - startTime;
                logger_1.log.debug('Route handler completed', {
                    module: 'server',
                    path,
                    method,
                    duration
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Register the route with the specified HTTP method
        switch (method.toLowerCase()) {
            case 'get':
                this.app.get(path, routeHandler);
                break;
            case 'post':
                this.app.post(path, routeHandler);
                break;
            case 'put':
                this.app.put(path, routeHandler);
                break;
            case 'delete':
                this.app.delete(path, routeHandler);
                break;
            case 'patch':
                this.app.patch(path, routeHandler);
                break;
            default:
                throw new errors_1.ServerError(`Unsupported HTTP method: ${method}`, { method });
        }
        logger_1.log.debug(`Route registered`, {
            module: 'server',
            method: method.toUpperCase(),
            path
        });
    }
    async start() {
        return new Promise((resolve, reject) => {
            const port = this.config.server.port || 3000;
            this.server = this.app.listen(port, () => {
                logger_1.log.info(`Mock server started`, {
                    module: 'server',
                    port,
                    url: `http://localhost:${port}`
                });
                // Log all available routes in debug mode
                if (this.config.server.logLevel === 'debug') {
                    logger_1.log.debug('Available routes:', {
                        module: 'server',
                        routes: Object.entries(this.config.routes).map(([path, config]) => `${config.method.toUpperCase()} ${path}`)
                    });
                }
                resolve();
            });
            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    const portError = new errors_1.PortError(`Port ${port} is already in use`, port);
                    logger_1.log.error('Failed to start server', {
                        module: 'server',
                        error: portError,
                        port
                    });
                    reject(portError);
                }
                else {
                    logger_1.log.error('Server error', {
                        module: 'server',
                        error,
                        port
                    });
                    reject(new errors_1.ServerError(error.message, { originalError: error }));
                }
            });
        });
    }
    /**
     * Stop the server gracefully
     */
    async stop() {
        if (!this.server) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) {
                    logger_1.log.error('Error stopping server', {
                        module: 'server',
                        error: err
                    });
                    reject(new errors_1.ServerError('Failed to stop server', { originalError: err }));
                }
                else {
                    this.server = null;
                    logger_1.log.info('Server stopped', { module: 'server' });
                    resolve();
                }
            });
        });
    }
    /**
     * Restart the server with new configuration
     */
    async restart(newConfig) {
        logger_1.log.info('Restarting server', { module: 'server' });
        await this.stop();
        if (newConfig) {
            this.config = newConfig;
            if (newConfig.server.logLevel) {
                (0, logger_1.setLogLevel)(newConfig.server.logLevel);
            }
            this.app = (0, express_1.default)();
            this.setupMiddleware();
            this.setupRoutes();
        }
        await this.start();
    }
    /**
     * Check if server is running
     */
    isRunning() {
        return this.server !== null && this.server.listening;
    }
    getApp() {
        return this.app;
    }
    /**
     * Get current server configuration
     */
    getConfig() {
        return this.config;
    }
    static generateFromSchema(schema, options = { port: 3000 }) {
        const port = options.port || 3000;
        const defaultConfig = {
            server: {
                port,
                cors: true,
                logLevel: 'info',
                ...options
            },
            routes: {
                'get:/api/data': {
                    path: '/api/data',
                    method: 'get',
                    response: (req) => {
                        const data = schema_1.SchemaParser.parse(schema);
                        logger_1.log.debug('Generated mock data', {
                            module: 'schema-parser',
                            schema: schema.title || 'untitled'
                        });
                        return {
                            message: 'This is a mock response',
                            timestamp: new Date().toISOString(),
                            data
                        };
                    }
                },
                'post:/api/data': {
                    path: '/api/data',
                    method: 'post',
                    response: (req) => ({
                        message: 'Data received',
                        receivedData: req.body,
                        timestamp: new Date().toISOString()
                    })
                }
            }
        };
        return new ServerGenerator(defaultConfig);
    }
}
exports.ServerGenerator = ServerGenerator;
function createMockServer(config) {
    return new ServerGenerator(config);
}
