#!/usr/bin/env node

// Using require to work around TypeScript module resolution issues with @modelcontextprotocol/sdk
const MCP_SDK = require('@modelcontextprotocol/sdk');
const axios = require('axios');

// AI layer imports (compiled from src/ai/)
let createAIProvider: any;
let inferSchema: any;
let mutateSchema: any;

try {
  const aiModule = require('../ai/index.js');
  createAIProvider = aiModule.createAIProvider;
  inferSchema = aiModule.inferSchema;
  mutateSchema = aiModule.mutateSchema;
} catch {
  // AI features unavailable (binary build without AI module)
}

/**
 * Schemocker MCP Server
 * 
 * This MCP server provides tools to interact with a running Schemocker instance,
 * allowing AI assistants to discover available endpoints, make requests, and reload schemas.
 */

class SchemockerMCPServer {
  private server: any;
  private baseUrl: string;
  private config: any;

  constructor(config: any = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.SCHEMOCKER_BASE_URL || 'http://localhost:3000',
      timeout: config.timeout || 10000,
      ...config,
    };
    this.baseUrl = this.config.baseUrl || 'http://localhost:3000';

    this.server = new MCP_SDK.Server(
      {
        name: 'schemocker-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * Sets up tool request handlers for MCP server
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(MCP_SDK.ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(MCP_SDK.CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_routes':
            return await this.handleListRoutes(args);
          case 'call_endpoint':
            return await this.handleCallEndpoint(args);
          case 'reload_schema':
            return await this.handleReloadSchema(args);
          case 'world_snapshot':
            return await this.handleWorldSnapshot(args);
          case 'generate_schema':
            return await this.handleGenerateSchema(args);
          case 'mutate_schema':
            return await this.handleMutateSchema(args);
          case 'seed_world':
            return await this.handleSeedWorld(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  /**
   * Returns the list of available tools
   */
  private getAvailableTools(): any[] {
    return [
      {
        name: 'list_routes',
        description: 'Lists all available routes/endpoints from Schemocker mock server, including paths, methods, and example payload shapes',
        inputSchema: {
          type: 'object',
          properties: {
            includeExamples: {
              type: 'boolean',
              description: 'Whether to include example responses for each route (default: true)',
              default: true,
            },
          },
        },
      },
      {
        name: 'call_endpoint',
        description: 'Makes an HTTP request to a Schemocker endpoint and returns JSON response',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              description: 'HTTP method to use',
            },
            path: {
              type: 'string',
              description: 'The endpoint path (e.g., /api/users)',
            },
            body: {
              type: 'object',
              description: 'Request body for POST, PUT, PATCH requests',
            },
            query: {
              type: 'object',
              description: 'Query parameters as key-value pairs',
            },
            headers: {
              type: 'object',
              description: 'Additional headers to include in the request',
            },
            scenario: {
              type: 'string',
              enum: ['happy-path', 'slow', 'error-heavy', 'sad-path'],
              description: "Apply a scenario preset for this call only. happy-path = fast/no errors. slow = 1-3s delay. error-heavy = random 4xx/5xx. sad-path = slow + errors. (default: uses server's global scenario)",
            },
          },
          required: ['method', 'path'],
        },
      },
      {
        name: 'reload_schema',
        description: 'Triggers a schema reload on the Schemocker server to pick up schema changes',
        inputSchema: {
          type: 'object',
          properties: {
            schemaPath: {
              type: 'string',
              description: 'Optional path to the schema file to reload (if not using the default schema)',
            },
          },
        },
      },
      {
        name: 'world_snapshot',
        description: 'Returns a snapshot of all entities currently registered in the mock world — their IDs and key fields. Useful for understanding what data exists so you can write tests, generate code, or check referential integrity (e.g. "what user IDs exist so I can set authorId on a post?")',
        inputSchema: {
          type: 'object',
          properties: {
            resource: {
              type: 'string',
              description: 'Optional: only return entities for a specific resource (e.g. "users", "posts"). If omitted, returns all resources.',
            },
            sample: {
              type: 'boolean',
              description: 'Whether to include sample field values for each entity (default: false — just IDs and type info). When true, includes a preview of each entity\'s key fields.',
              default: false,
            },
          },
        },
      },
      {
        name: 'generate_schema',
        description: 'Generate a JSON Schema from a natural language description and hot-reload the running Schemocker server with it. This is the primary way to create a mock API without writing a schema by hand. Example: describe "a blog with users, posts, and comments" → server boots with all routes live.',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Natural language description of the API you want to mock (e.g. "a social media post with likes, comments, and author")',
            },
            aiProvider: {
              type: 'string',
              enum: ['openai', 'ollama', 'vllm'],
              description: 'AI provider to use (default: from SCHEMOCKER_AI_PROVIDER env or openai)',
            },
            aiModel: {
              type: 'string',
              description: 'Model name (e.g. gpt-4o-mini, qwen2.5:3b). Defaults to provider-specific default.',
            },
          },
          required: ['description'],
        },
      },
      {
        name: 'mutate_schema',
        description: 'Mutate the current running schema with a natural language instruction. Takes the live schema + NL instruction, sends to LLM, returns the merged updated schema and hot-reloads the server.',
        inputSchema: {
          type: 'object',
          properties: {
            instruction: {
              type: 'string',
              description: 'Natural language instruction for how to change the schema (e.g. "add a createdAt timestamp", "add a tags array")',
            },
            aiProvider: {
              type: 'string',
              enum: ['openai', 'ollama', 'vllm'],
              description: 'AI provider to use (default: from SCHEMOCKER_AI_PROVIDER env or openai)',
            },
            aiModel: {
              type: 'string',
              description: 'Model name. Defaults to provider-specific default.',
            },
          },
          required: ['instruction'],
        },
      },
      {
        name: 'seed_world',
        description: 'Populate world-state with N realistic mock records using LLM-generated values for semantic fields (bio, description, title) rather than faker noise. After seeding, GET requests return real-looking records for demos and AI agent testing.',
        inputSchema: {
          type: 'object',
          properties: {
            resource: {
              type: 'string',
              description: 'Optional: the resource to seed (e.g. "users", "posts"). If omitted, seeds the primary resource.',
            },
            count: {
              type: 'integer',
              description: 'Number of records to seed (default: 5)',
              default: 5,
            },
          },
        },
      },
    ];
  }

  /**
   * Handles the list_routes tool call
   */
  private async handleListRoutes(args?: any) {
    const includeExamples = args?.includeExamples !== false;

    try {
      // Try to get routes from Schemocker's internal routes endpoint
      const routesUrl = `${this.baseUrl}/__schemock/routes`;
      let routes: any[] = [];

      try {
        const response = await axios.get(routesUrl, {
          timeout: this.config.timeout,
        });
        routes = response.data.routes || [];
      } catch (_error) {
        // If the routes endpoint doesn't exist, try to discover from the schema
        const schemaUrl = `${this.baseUrl}/__schemock/schema`;
        const schemaResponse = await axios.get(schemaUrl, {
          timeout: this.config.timeout,
        });
        routes = this.extractRoutesFromSchema(schemaResponse.data);
      }

      // If we want examples, fetch them
      if (includeExamples && routes.length > 0) {
        const routesWithExamples = await Promise.all(
          routes.map(async (route: any) => {
            try {
              const exampleResponse = await this.callSchemockerEndpoint(
                route.method,
                route.path
              );
              return {
                ...route,
                exampleResponse: exampleResponse.data,
              };
            } catch (_error) {
              // If we can't get an example, just return route info
              return route;
            }
          })
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(routesWithExamples, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(routes, null, 2),
          },
        ],
      };
    } catch (error) {
      const axiosError = error as any;
      throw new Error(
        `Failed to list routes: ${axiosError.message}. Make sure Schemocker is running at ${this.baseUrl}`
      );
    }
  }

  /**
   * Handles the call_endpoint tool call
   */
  private async handleCallEndpoint(args: any) {
    const { method, path, body, query, headers } = args;

    if (!method || !path) {
      throw new Error('Missing required parameters: method and path are required');
    }

    try {
      const response = await this.callSchemockerEndpoint(
        method,
        path,
        body,
        query,
        headers
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const axiosError = error as any;
      if (axiosError.response) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: axiosError.response.status,
                  statusText: axiosError.response.statusText,
                  headers: axiosError.response.headers,
                  data: axiosError.response.data,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
      throw new Error(
        `Failed to call endpoint: ${axiosError.message}. Make sure Schemocker is running at ${this.baseUrl}`
      );
    }
  }

  /**
   * Handles the reload_schema tool call
   */
  private async handleReloadSchema(args?: any) {
    const { schemaPath } = args || {};

    try {
      const reloadUrl = `${this.baseUrl}/__schemock/reload`;
      const response = await axios.post(
        reloadUrl,
        schemaPath ? { schemaPath } : {},
        {
          timeout: this.config.timeout,
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: response.data.message || 'Schema reloaded successfully',
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const axiosError = error as any;
      throw new Error(
        `Failed to reload schema: ${axiosError.message}. The reload endpoint may not be available or Schemocker is not running at ${this.baseUrl}`
      );
    }
  }

  /**
   * Handles the world_snapshot tool call.
   * Returns all entities currently registered in the mock world,
   * with their IDs and key fields, so AIs can understand what data
   * exists for writing tests or code generation.
   */
  private async handleWorldSnapshot(args?: { resource?: string; sample?: boolean }) {
    const { resource, sample = false } = args || {};

    try {
      const url = `${this.baseUrl}/__schemock/world`;
      const response = await axios.get(url, { timeout: this.config.timeout });
      const data = response.data as {
        resources: string[];
        entities: Record<string, string[]>;
        totalEntities: number;
      };

      if (!data.resources || data.resources.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: 'No entities in world yet. Make a GET/POST request first to populate the world.',
              hint: 'Call an endpoint like GET /api/users first, then check world_snapshot again.'
            }, null, 2)
          }]
        };
      }

      // Optionally filter by resource
      const resources = resource
        ? [resource.toLowerCase()].filter(r => data.resources.includes(r))
        : data.resources;

      const snapshot: Record<string, any> = {
        totalEntities: data.totalEntities,
        resources
      };

      for (const res of resources) {
        const ids = data.entities[res] || [];
        snapshot[res] = {
          count: ids.length,
          ids,
          hint: `Found ${ids.length} ${res} in the world. Use these IDs when setting foreign keys.`
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(snapshot, null, 2)
        }]
      };
    } catch (error) {
      const axiosError = error as any;
      throw new Error(
        `Failed to get world snapshot: ${axiosError.message}. Make sure Schemocker is running at ${this.baseUrl}`
      );
    }
  }

  /**
   * Handles the generate_schema tool call.
   * Takes a natural language description → generates JSON Schema via LLM → hot-reloads server.
   */
  private async handleGenerateSchema(args: { description: string; aiProvider?: string; aiModel?: string }) {
    if (!createAIProvider || !inferSchema) {
      throw new Error(
        'AI features are not available. The AI module may not be included in this build. ' +
        'Set SCHEMOCKER_API_KEY for OpenAI, or SCHEMOCKER_AI_PROVIDER=ollama for local inference.'
      );
    }

    const { description, aiProvider, aiModel } = args;

    try {
      const provider = createAIProvider({ provider: aiProvider, model: aiModel });
      const { schema } = await inferSchema(description, provider, { model: aiModel, provider: aiProvider as any });

      // Push schema to the running Schemocker server via hot-reload endpoint
      const response = await axios.post(
        `${this.baseUrl}/__schemock/reload`,
        { schema },
        { timeout: 30000 }
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            schema,
            serverMessage: response.data.message,
            hint: 'Schema is live. Use list_routes to see the new endpoints.'
          }, null, 2)
        }]
      };
    } catch (error: any) {
      const message = error?.message || String(error);
      if (message.includes('AI features are not available')) throw new Error(message);
      throw new Error(`generate_schema failed: ${message}`);
    }
  }

  /**
   * Handles the mutate_schema tool call.
   * Takes the current schema + NL instruction → LLM merges the change → hot-reloads server.
   */
  private async handleMutateSchema(args: { instruction: string; aiProvider?: string; aiModel?: string }) {
    if (!createAIProvider || !mutateSchema) {
      throw new Error(
        'AI features are not available. The AI module may not be included in this build.'
      );
    }

    const { instruction, aiProvider, aiModel } = args;

    try {
      // First, fetch the current schema from the running server
      const schemaResponse = await axios.get(`${this.baseUrl}/__schemock/schema`, {
        timeout: this.config.timeout,
      }).catch(() => null);

      if (!schemaResponse?.data) {
        throw new Error(
          'Could not fetch current schema from the running server. ' +
          'Make sure Schemocker is running and you have a schema loaded.'
        );
      }

      const currentSchema = schemaResponse.data;
      const provider = createAIProvider({ provider: aiProvider, model: aiModel });
      const { schema: mutatedSchema } = await mutateSchema(
        currentSchema,
        instruction,
        provider,
        { model: aiModel, provider: aiProvider as any }
      );

      // Push mutated schema to the running server
      const response = await axios.post(
        `${this.baseUrl}/__schemock/reload`,
        { schema: mutatedSchema },
        { timeout: 30000 }
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            mutatedSchema,
            serverMessage: response.data.message,
            hint: 'Mutated schema is live. Use list_routes to verify the changes.'
          }, null, 2)
        }]
      };
    } catch (error: any) {
      const message = error?.message || String(error);
      if (message.includes('AI features are not available')) throw new Error(message);
      throw new Error(`mutate_schema failed: ${message}`);
    }
  }

  /**
   * Handles the seed_world tool call.
   * Populates world-state with N realistic records via the seed endpoint.
   */
  private async handleSeedWorld(args: { resource?: string; count?: number }) {
    const { resource, count = 5 } = args || {};

    try {
      const response = await axios.post(
        `${this.baseUrl}/__schemock/seed`,
        { resource, count },
        { timeout: this.config.timeout }
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: response.data.message,
            snapshot: response.data.snapshot,
            timestamp: response.data.timestamp
          }, null, 2)
        }]
      };
    } catch (error: any) {
      throw new Error(
        `seed_world failed: ${error?.message}. Make sure Schemocker is running with a loaded schema.`
      );
    }
  }

  /**
   * Makes a call to a Schemocker endpoint
   */
  private async callSchemockerEndpoint(
    method: string,
    path: string,
    body?: any,
    query?: Record<string, unknown>,
    headers?: Record<string, string>
  ) {
    const url = `${this.baseUrl}${path}`;
    const config: any = {
      method: method.toLowerCase(),
      url,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = body;
    }

    if (query) {
      config.params = query;
    }

    return await axios(config);
  }

  /**
   * Extracts route information from a JSON Schema
   */
  private extractRoutesFromSchema(schema: any): any[] {
    const routes: any[] = [];

    // Check for custom routes defined in x-schemock-routes
    if (schema['x-schemock-routes'] && Array.isArray(schema['x-schemock-routes'])) {
      return schema['x-schemock-routes'].map((route: any) => ({
        method: route.method.toUpperCase(),
        path: route.path,
        description: route.description || `Custom ${route.method.toUpperCase()} route`,
        statusCode: route.statusCode || 200,
        delay: route.delay,
        headers: route.headers,
      }));
    }

    // Generate CRUD routes based on schema properties
    const basePath = schema['x-schemock-base-path'] || '/api/resource';
    const resourceName = schema.title || 'resource';

    // GET /api/resource - List all items
    routes.push({
      method: 'GET',
      path: basePath,
      description: `List all ${resourceName} items`,
      response: { type: 'array', items: schema },
    });

    // GET /api/resource/:id - Get single item
    routes.push({
      method: 'GET',
      path: `${basePath}/:id`,
      description: `Get a single ${resourceName} by ID`,
      response: schema,
    });

    // POST /api/resource - Create new item
    routes.push({
      method: 'POST',
      path: basePath,
      description: `Create a new ${resourceName}`,
      request: schema,
      response: schema,
    });

    // PUT /api/resource/:id - Update item
    routes.push({
      method: 'PUT',
      path: `${basePath}/:id`,
      description: `Update a ${resourceName} by ID`,
      request: schema,
      response: schema,
    });

    // DELETE /api/resource/:id - Delete item
    routes.push({
      method: 'DELETE',
      path: `${basePath}/:id`,
      description: `Delete a ${resourceName} by ID`,
      response: { success: true },
    });

    return routes;
  }

  /**
   * Starts the MCP server
   */
  public async start(): Promise<void> {
    const transport = new MCP_SDK.StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Schemocker MCP Server started, connecting to ${this.baseUrl}`);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new SchemockerMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = { SchemockerMCPServer };
