import { createMockServer } from '../src/index';
import { ServerGenerator } from '../src/generators/server';
import { Schema } from '../src/types';

describe('Index Module', () => {
  describe('createMockServer', () => {
    it('should create a mock server instance', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { port: 3000 });
      expect(server).toBeInstanceOf(ServerGenerator);
    });

    it('should use default port if not specified', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema);
      expect(server).toBeInstanceOf(ServerGenerator);
      const config = server.getConfig();
      expect(config.server.port).toBe(3000);
    });

    it('should use custom port if specified', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { port: 8080 });
      expect(server).toBeInstanceOf(ServerGenerator);
      const config = server.getConfig();
      expect(config.server.port).toBe(8080);
    });

    it('should accept server options', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, {
        port: 3001,
        cors: false,
        logLevel: 'debug'
      });
      
      expect(server).toBeInstanceOf(ServerGenerator);
      const config = server.getConfig();
      expect(config.server.cors).toBe(false);
      expect(config.server.logLevel).toBe('debug');
    });

    it('should generate routes from schema', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { port: 3002 });
      const config = server.getConfig();
      
      expect(config.routes).toBeDefined();
      expect(config.routes['get:/api/users']).toBeDefined();
      expect(config.routes['post:/api/users']).toBeDefined();
    });

    it('should handle schema without title', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { port: 3003 });
      const config = server.getConfig();
      
      expect(config.routes['get:/api/datas']).toBeDefined();
    });

    it('should handle complex schema', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          price: { type: 'number', minimum: 0 },
          inStock: { type: 'boolean' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 5
          }
        },
        required: ['id', 'name', 'price']
      };

      const server = createMockServer(schema, { port: 3004 });
      expect(server).toBeInstanceOf(ServerGenerator);
    });

    it('should accept resource name option', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { 
        port: 3005,
        resourceName: 'custom-resource'
      });
      
      const config = server.getConfig();
      expect(config.routes['get:/api/custom-resource']).toBeDefined();
    });

    it('should accept base path option', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { 
        port: 3006,
        basePath: '/v1/custom'
      });
      
      const config = server.getConfig();
      expect(config.routes['get:/v1/custom']).toBeDefined();
    });

    it('should accept strict mode option', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { 
        port: 3007,
        strict: true
      });
      
      const config = server.getConfig();
      expect(config.server.strict).toBe(true);
    });

    it('should accept scenario option', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { 
        port: 3008,
        scenario: 'slow'
      });
      
      const config = server.getConfig();
      expect(config.server.scenario).toBe('slow');
    });
  });

  describe('Module Exports', () => {
    it('should export ServerGenerator from generators/server', () => {
      expect(ServerGenerator).toBeDefined();
      expect(typeof ServerGenerator.generateFromSchema).toBe('function');
    });

    it('should export createMockServer function', () => {
      expect(createMockServer).toBeDefined();
      expect(typeof createMockServer).toBe('function');
    });

    it('should export types', () => {
      // Just verify the module can be imported
      const types = require('../src/types');
      expect(types).toBeDefined();
    });

    it('should export errors', () => {
      // Just verify the module can be imported
      const errors = require('../src/errors');
      expect(errors).toBeDefined();
    });

    it('should export validation utilities', () => {
      // Just verify the module can be imported
      const validation = require('../src/utils/validation');
      expect(validation).toBeDefined();
    });

    it('should export watcher utilities', () => {
      // Just verify the module can be imported
      const watcher = require('../src/utils/watcher');
      expect(watcher).toBeDefined();
    });

    it('should export vite integration', () => {
      // Just verify the module can be imported
      const vite = require('../src/integrations/vite');
      expect(vite).toBeDefined();
    });
  });

  describe('Server Configuration', () => {
    it('should handle multiple options together', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Item',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, {
        port: 3099,
        cors: true,
        logLevel: 'warn',
        strict: true,
        scenario: 'sad-path'
      });
      
      const config = server.getConfig();
      expect(config.server.port).toBe(3099);
      expect(config.server.cors).toBe(true);
      expect(config.server.logLevel).toBe('warn');
      expect(config.server.strict).toBe(true);
      expect(config.server.scenario).toBe('sad-path');
    });

    it('should generate default CRUD routes', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Customer',
        properties: {
          id: { type: 'string' }
        }
      };

      const server = createMockServer(schema, { port: 4000 });
      const config = server.getConfig();
      
      // Should have all CRUD routes
      expect(config.routes['get:/api/customers']).toBeDefined();
      expect(config.routes['get:/api/customers/:id']).toBeDefined();
      expect(config.routes['post:/api/customers']).toBeDefined();
      expect(config.routes['put:/api/customers/:id']).toBeDefined();
      expect(config.routes['delete:/api/customers/:id']).toBeDefined();
    });
  });

  describe('Schema Handling', () => {
    it('should handle nested properties', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Order',
        properties: {
          id: { type: 'string' },
          customer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number' }
              }
            }
          }
        }
      };

      const server = createMockServer(schema, { port: 4001 });
      expect(server).toBeInstanceOf(ServerGenerator);
    });

    it('should handle schema with definitions', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User',
        definitions: {
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' }
            }
          }
        },
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          address: { $ref: '#/definitions/Address' }
        }
      };

      const server = createMockServer(schema, { port: 4002 });
      expect(server).toBeInstanceOf(ServerGenerator);
    });

    it('should handle schema with format constraints', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Document',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          uri: { type: 'string', format: 'uri' },
          date: { type: 'string', format: 'date-time' },
          pattern: { type: 'string', pattern: '^[A-Z]{2}-\\d{3}$' }
        }
      };

      const server = createMockServer(schema, { port: 4003 });
      expect(server).toBeInstanceOf(ServerGenerator);
    });
  });
});
