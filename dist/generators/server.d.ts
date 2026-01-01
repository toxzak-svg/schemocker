import { Application } from 'express';
import { ServerOptions, MockServerConfig } from '../types';
export declare class ServerGenerator {
    private app;
    private config;
    private parser;
    private server;
    private state;
    private version;
    constructor(config: MockServerConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupRoute;
    start(): Promise<void>;
    /**
     * Stop the server gracefully
     */
    stop(): Promise<void>;
    /**
     * Restart the server with new configuration
     */
    restart(newConfig?: MockServerConfig): Promise<void>;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    getApp(): Application;
    /**
     * Get current server configuration
     */
    getConfig(): MockServerConfig;
    /**
     * Add branding metadata to response (unless disabled for paid users)
     */
    private addBranding;
    static generateFromSchema(schema: any, options?: Omit<ServerOptions, 'port'> & {
        port?: number;
    }): ServerGenerator;
}
export declare function createMockServer(config: MockServerConfig): ServerGenerator;
