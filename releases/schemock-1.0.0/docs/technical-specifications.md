# Schemock Technical Specifications

## Overview

Schemock is a lightweight mock server generator that creates RESTful API endpoints from JSON Schema definitions. Built with TypeScript and Node.js, it provides developers with a powerful tool for rapid prototyping and testing of client applications without requiring backend implementation.

## Architecture

### Core Components

#### 1. Main Entry Point (`src/index.ts`)
- **Function**: `createMockServer(schema, options)`
- **Purpose**: Main entry point for creating mock servers
- **Default Behavior**: Provides demo server with sample schema when run directly
- **Dependencies**: ServerGenerator, ServerOptions, Schema types

#### 2. Server Generator (`src/generators/server.ts`)
- **Class**: `ServerGenerator`
- **Purpose**: Generates Express.js servers from configurations
- **Key Methods**:
  - `constructor(config: MockServerConfig)`: Initializes server with middleware and routes
  - `setupMiddleware()`: Configures CORS, JSON parsing, and request logging
  - `setupRoutes()`: Creates API endpoints from route configurations
  - `setupRoute(routeConfig)`: Registers individual routes with specified HTTP methods
  - `start()`: Starts the server on configured port
  - `getApp()`: Returns Express application instance
  - `generateFromSchema(schema, options)`: Static method to create server from schema

#### 3. Schema Parser (`src/parsers/schema.ts`)
- **Class**: `SchemaParser`
- **Purpose**: Generates mock data from JSON Schema definitions
- **Key Method**: `parse(schema: Schema): any`
- **Supported Features**:
  - Basic types: string, number, integer, boolean, object, array, null
  - String formats: date-time, email, hostname, ipv4, ipv6, uri, uuid
  - String patterns (basic regex support)
  - String length constraints (minLength, maxLength)
  - Numeric constraints (minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf)
  - Array constraints (minItems, maxItems)
  - Object properties and required fields
  - Enum values
  - Schema composition (oneOf, anyOf, allOf)
  - Additional properties

#### 4. CLI Interface (`src/cli/index.ts`)
- **Framework**: Commander.js
- **Commands**:
  - `start [schemaPath]`: Start mock server with optional schema file
  - `init [directory]`: Initialize new mock server project
- **Options**:
  - `-p, --port <number>`: Server port (default: 3000)
  - `--no-cors`: Disable CORS
  - `--log-level <level>`: Set logging level
  - `--name <name>`: Project name for init
  - `--port <port>`: Default port for init

#### 5. Type Definitions (`src/types/index.ts`)
- **Core Interfaces**:
  - `Schema`: Extended JSON Schema type definition
  - `ServerOptions`: Server configuration options
  - `RouteConfig`: Individual route configuration
  - `MockServerConfig`: Complete server configuration

## Data Flow

1. **Schema Loading**: JSON Schema is loaded from file or passed programmatically
2. **Server Configuration**: Server options and route configurations are prepared
3. **Server Generation**: ServerGenerator creates Express application with middleware
4. **Route Setup**: Routes are registered based on schema or configuration
5. **Mock Data Generation**: SchemaParser generates mock data on request
6. **Response Handling**: Mock responses are sent with appropriate headers and delays

## Configuration System

### Server Options
```typescript
interface ServerOptions {
  port: number;              // Server port (1-65535)
  basePath?: string;         // Base path for all routes
  watch?: boolean;           // Watch for file changes (future feature)
  cors?: boolean;            // Enable/disable CORS
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}
```

### Route Configuration
```typescript
interface RouteConfig {
  path: string;              // Route path
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  response: any;            // Response data or function
  statusCode?: number;      // HTTP status code (default: 200)
  delay?: number;           // Response delay in milliseconds
  headers?: Record<string, string>; // Custom headers
}
```

### Mock Server Configuration
```typescript
interface MockServerConfig {
  server: ServerOptions;
  routes: Record<string, RouteConfig>;
}
```

## Schema Support

### Basic Types
- **String**: Supports formats, patterns, length constraints
- **Number/Integer**: Supports ranges, exclusives, multiples
- **Boolean**: Random true/false generation
- **Array**: Supports item schemas, length constraints
- **Object**: Supports properties, required fields, additional properties
- **Null**: Returns null value

### Advanced Features
- **Composition**: oneOf, anyOf, allOf with recursive parsing
- **References**: $ref placeholder (full implementation pending)
- **Enums**: Random selection from enum values
- **Formats**: Predefined formats for common data types
- **Patterns**: Basic regex pattern matching

## Error Handling

### Validation Errors
- Schema parsing errors with detailed messages
- Port number validation (1-65535)
- File existence checks
- JSON parsing error handling

### Runtime Errors
- Express error middleware integration
- Route handler error catching
- Graceful server shutdown on SIGINT

## Performance Considerations

### Memory Usage
- Lazy data generation per request
- No in-memory storage of generated data
- Efficient schema parsing with static methods

### Response Time
- Configurable delays for realistic testing
- Fast mock data generation algorithms
- Minimal overhead in request processing

## Extensibility

### Plugin Points
- Custom response generators via function responses
- Middleware injection in Express pipeline
- Custom schema parsers for specialized types
- Route handler customization

### Future Enhancements
- File watching and hot reloading
- Database integration for persistent mock data
- GraphQL schema support
- OpenAPI/Swagger integration
- WebSocket mock endpoints

## Security Considerations

### Current Implementation
- CORS configuration options
- Request logging for monitoring
- No authentication built-in (intentional for mocking)

### Recommendations
- Use in development environments only
- Avoid exposing sensitive data in schemas
- Implement proper authentication for production use

## Testing Infrastructure

### Unit Tests
- Jest test framework
- Coverage reporting
- Test files in `__tests__/` directory

### Test Coverage Areas
- Schema parsing logic
- Server generation
- CLI command handling
- Mock data generation

## Build System

### TypeScript Configuration
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Declaration files generated

### Build Process
- `npm run build`: TypeScript compilation
- `npm run test`: Jest test execution with coverage
- `npm run build:exe`: Executable generation using pkg

## Dependencies

### Runtime Dependencies
- **express**: Web server framework
- **cors**: CORS middleware
- **body-parser**: Request body parsing
- **chalk**: Terminal color formatting
- **commander**: CLI framework
- **inquirer**: Interactive prompts
- **json-schema-to-typescript**: Schema type generation
- **uuid**: UUID generation

### Development Dependencies
- **TypeScript**: Type checking and compilation
- **Jest**: Testing framework
- **ts-node**: TypeScript execution
- **pkg**: Executable packaging
- **@types/**: TypeScript definitions

## Platform Support

### Node.js
- Minimum version: Node 18 (as specified in pkg configuration)
- Supports Windows, macOS, Linux

### Executable Generation
- Target: node18-win-x64 (Windows 64-bit)
- Standalone executable with bundled Node.js runtime