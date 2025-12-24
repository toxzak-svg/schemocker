import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Server } from 'http';
import { ServerOptions, RouteConfig, MockServerConfig } from '../types';
import { SchemaParser } from '../parsers/schema';
import { PortError, ServerError } from '../errors';
import { log, setLogLevel } from '../utils/logger';

export class ServerGenerator {
  private app: Application;
  private config: MockServerConfig;
  private parser: SchemaParser;
  private server: Server | null = null;

  constructor(config: MockServerConfig) {
    this.config = config;
    this.app = express();
    this.parser = new SchemaParser();
    
    // Set log level from config
    if (config.server.logLevel) {
      setLogLevel(config.server.logLevel);
    }
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Enable CORS if configured
    if (this.config.server.cors) {
      this.app.use(cors());
      log.debug('CORS enabled', { module: 'server' });
    }

    // JSON body parsing with size limit for security
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
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
      res.json = function(body: any) {
        const duration = Date.now() - startTime;
        log.request(req.method, req.path, res.statusCode, duration);
        return originalJson(body);
      };

      next();
    });

    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      log.error('Request error', {
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

  private setupRoutes(): void {
    // Setup each route from the config
    Object.entries(this.config.routes).forEach(([_, routeConfig]) => {
      this.setupRoute(routeConfig);
    });

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      log.warn('Route not found', {
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

  private setupRoute(routeConfig: RouteConfig): void {
    const { path, method, response, statusCode = 200, delay = 0, headers = {} } = routeConfig;
    
    const routeHandler = async (req: Request, res: Response, next: NextFunction) => {
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
        } else if (typeof response === 'object' && response !== null) {
          // If response is an object, use it directly
          res.status(statusCode).json(response);
        } else {
          // For other types, send as is
          res.status(statusCode).send(response);
        }
        
        const duration = Date.now() - startTime;
        log.debug('Route handler completed', {
          module: 'server',
          path,
          method,
          duration
        });
      } catch (error) {
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
        throw new ServerError(`Unsupported HTTP method: ${method}`, { method });
    }
    
    log.debug(`Route registered`, {
      module: 'server',
      method: method.toUpperCase(),
      path
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = this.config.server.port || 3000;
      
      this.server = this.app.listen(port, () => {
        log.info(`Mock server started`, {
          module: 'server',
          port,
          url: `http://localhost:${port}`
        });
        
        // Log all available routes in debug mode
        if (this.config.server.logLevel === 'debug') {
          log.debug('Available routes:', {
            module: 'server',
            routes: Object.entries(this.config.routes).map(([path, config]) => 
              `${config.method.toUpperCase()} ${path}`
            )
          });
        }
        
        resolve();
      });

      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          const portError = new PortError(`Port ${port} is already in use`, port);
          log.error('Failed to start server', {
            module: 'server',
            error: portError,
            port
          });
          reject(portError);
        } else {
          log.error('Server error', {
            module: 'server',
            error,
            port
          });
          reject(new ServerError(error.message, { originalError: error }));
        }
      });
    });
  }

  /**
   * Stop the server gracefully
   */
  public async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          log.error('Error stopping server', {
            module: 'server',
            error: err
          });
          reject(new ServerError('Failed to stop server', { originalError: err }));
        } else {
          this.server = null;
          log.info('Server stopped', { module: 'server' });
          resolve();
        }
      });
    });
  }

  /**
   * Restart the server with new configuration
   */
  public async restart(newConfig?: MockServerConfig): Promise<void> {
    log.info('Restarting server', { module: 'server' });
    
    await this.stop();
    
    if (newConfig) {
      this.config = newConfig;
      if (newConfig.server.logLevel) {
        setLogLevel(newConfig.server.logLevel);
      }
      this.app = express();
      this.setupMiddleware();
      this.setupRoutes();
    }
    
    await this.start();
  }

  /**
   * Check if server is running
   */
  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  public getApp(): Application {
    return this.app;
  }

  /**
   * Get current server configuration
   */
  public getConfig(): MockServerConfig {
    return this.config;
  }

  public static generateFromSchema(schema: any, options: Omit<ServerOptions, 'port'> & { port?: number } = { port: 3000 }): ServerGenerator {
    const port = options.port || 3000;
    const defaultConfig: MockServerConfig = {
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
          response: (req: Request) => {
            const data = SchemaParser.parse(schema);
            log.debug('Generated mock data', {
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
          response: (req: Request) => ({
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

export function createMockServer(config: MockServerConfig): ServerGenerator {
  return new ServerGenerator(config);
}
