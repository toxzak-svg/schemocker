import { v4 as uuidv4 } from 'uuid';
import { SchemaParser } from '../parsers/schema';
import {
    RouteConfig,
    RouteRequest,
    ServerState,
    JSONValue,
    Schema,
    ServerOptions
} from '../types';

/**
 * Determine resource name from schema or options
 */
export function determineResourceName(schema: Schema, options: { resourceName?: string }): string {
    if (options.resourceName) {
        return options.resourceName;
    }
    if (schema.title) {
        const title = schema.title.toLowerCase();
        return title.endsWith('s') ? title : title + 's';
    }
    return 'data';
}

/**
 * Determine base path from resource name or options
 */
export function determineBasePath(resourceName: string, options: { basePath?: string }): string {
    return options.basePath || `/api/${resourceName}`;
}

/**
 * Check if a response definition is a schema
 */
function isSchemaResponse(response: JSONValue | Schema): response is Schema {
    return typeof response === 'object' && response !== null &&
        ('type' in response || '$ref' in response || 'oneOf' in response ||
            'anyOf' in response || 'allOf' in response);
}

/**
 * Initialize resource state if not exists
 */
function initializeResourceState(state: ServerState, resource: string): void {
    if (!state[resource]) {
        state[resource] = [];
    }
}

/**
 * Handle GET request for single item by ID
 */
function handleGetById(
    state: ServerState,
    resource: string,
    req: RouteRequest,
    responseSchema: Schema,
    mainSchema: Schema,
    options: { strict?: boolean },
    wrap: boolean
): JSONValue {
    const item = state[resource].find((i: JSONValue) =>
        typeof i === 'object' && i !== null && 'id' in i && i.id === req.params?.id
    );

    if (item) {
        return wrap ? {
            success: true,
            message: 'Mock data retrieved',
            timestamp: new Date().toISOString(),
            data: item
        } : item;
    }

    // Fallback: generate, tie to ID, and store in state for consistency
    let data = SchemaParser.parse(responseSchema, mainSchema, new Set(), options.strict, resource);
    if (data && typeof data === 'object' && !Array.isArray(data) && req.params?.id) {
        const dataObj = data as Record<string, JSONValue>;
        dataObj.id = req.params.id;
        state[resource].push(dataObj);
        data = dataObj;
    }

    return wrap ? {
        success: true,
        message: 'Mock data generated',
        timestamp: new Date().toISOString(),
        data
    } : data;
}

/**
 * Handle GET request for collection
 */
function handleGetCollection(
    state: ServerState,
    resource: string,
    responseSchema: Schema,
    mainSchema: Schema,
    options: { strict?: boolean },
    wrap: boolean
): JSONValue {
    // Return list from state
    if (state[resource].length === 0) {
        // Populate with some initial data
        const generated = SchemaParser.parse(responseSchema, mainSchema, new Set(), options.strict, resource);
        if (Array.isArray(generated)) {
            state[resource] = generated;
        } else {
            for (let i = 0; i < 3; i++) {
                const item = SchemaParser.parse(responseSchema, mainSchema, new Set(), options.strict, resource);
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    const itemObj = item as Record<string, JSONValue>;
                    if (!itemObj.id) {
                        itemObj.id = uuidv4();
                    }
                }
                state[resource].push(item);
            }
        }
    }

    return wrap ? {
        success: true,
        message: 'Mock data retrieved',
        timestamp: new Date().toISOString(),
        data: state[resource],
        meta: { total: state[resource].length }
    } : state[resource];
}

/**
 * Handle POST request (create)
 */
function handlePost(
    state: ServerState,
    resource: string,
    req: RouteRequest,
    wrap: boolean
): JSONValue {
    const bodyObj = typeof req.body === 'object' && req.body !== null ? req.body as Record<string, unknown> : {};
    const newItem: Record<string, JSONValue> = {
        id: (bodyObj.id as string) || uuidv4(),
        ...bodyObj as Record<string, JSONValue>,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    state[resource].push(newItem);

    return wrap ? { success: true, data: newItem, message: 'Created successfully' } : newItem;
}

/**
 * Handle PUT request (update)
 */
function handlePut(
    state: ServerState,
    resource: string,
    req: RouteRequest,
    wrap: boolean
): JSONValue {
    const index = state[resource].findIndex((i: JSONValue) =>
        typeof i === 'object' && i !== null && 'id' in i && i.id === req.params?.id
    );

    const bodyObj = typeof req.body === 'object' && req.body !== null ? req.body as Record<string, unknown> : {};
    const existingItem = index >= 0 && typeof state[resource][index] === 'object' && state[resource][index] !== null
        ? state[resource][index] as Record<string, unknown>
        : {};

    const updatedItem: Record<string, JSONValue> = {
        ...(existingItem as Record<string, JSONValue>),
        ...bodyObj as Record<string, JSONValue>,
        id: req.params?.id || '',
        updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
        state[resource][index] = updatedItem;
    } else {
        state[resource].push(updatedItem);
    }

    return wrap ? { success: true, data: updatedItem } : updatedItem;
}

/**
 * Handle DELETE request
 */
function handleDelete(
    state: ServerState,
    resource: string,
    req: RouteRequest,
    wrap: boolean
): JSONValue {
    state[resource] = state[resource].filter((i: JSONValue) =>
        typeof i === 'object' && i !== null && 'id' in i && i.id !== req.params?.id
    );

    return wrap ? { success: true, message: 'Deleted successfully' } : { message: 'Deleted successfully' };
}

/**
 * Create a route handler for a specific method and path
 */
export function createRouteHandler(
    method: string,
    routePath: string,
    routeDef: { response?: JSONValue | Schema },
    mainSchema: Schema,
    options: { strict?: boolean },
    wrap: boolean = true
): (req: RouteRequest, state: ServerState) => JSONValue {
    return (req: RouteRequest, state: ServerState): JSONValue => {
        const parts = routePath.split('/').filter(p => p && p !== 'api');
        const resource = parts[0] || 'data';

        initializeResourceState(state, resource);

        const isResponseSchema = routeDef.response !== undefined && isSchemaResponse(routeDef.response);
        const responseSchema: Schema = (isResponseSchema && routeDef.response) ? routeDef.response as Schema : mainSchema;

        if (method === 'get') {
            if (routePath.endsWith('/:id')) {
                return handleGetById(state, resource, req, responseSchema, mainSchema, options, wrap);
            } else {
                // Collection GET logic - only if it's a default route (wrap=true) or explicitly a schema array
                if (wrap || (isResponseSchema && responseSchema.type === 'array')) {
                    return handleGetCollection(state, resource, responseSchema, mainSchema, options, wrap);
                } else {
                    // Static or non-wrapped GET
                    if (isResponseSchema) {
                        return SchemaParser.parse(routeDef.response as Schema, mainSchema, new Set(), options.strict, resource);
                    }
                    return routeDef.response as JSONValue;
                }
            }
        }

        if (method === 'post') {
            return handlePost(state, resource, req, wrap);
        }

        if (method === 'put' && routePath.endsWith('/:id')) {
            return handlePut(state, resource, req, wrap);
        }

        if (method === 'delete' && routePath.endsWith('/:id')) {
            return handleDelete(state, resource, req, wrap);
        }

        // Default behavior if not matched
        if (isResponseSchema) {
            return SchemaParser.parse(routeDef.response as Schema, mainSchema, new Set(), options.strict, resource);
        }
        return (routeDef.response as JSONValue) || SchemaParser.parse(mainSchema, undefined, new Set(), options.strict, resource);
    };
}

/**
 * Generate routes from x-schemock-routes extension
 */
export function generateCustomRoutes(
    schema: Schema,
    createHandler: (method: string, path: string, routeDef: { response?: JSONValue | Schema }) => (req: RouteRequest, state: ServerState) => JSONValue
): Record<string, RouteConfig> {
    const routes: Record<string, RouteConfig> = {};

    if (!schema['x-schemock-routes'] || !Array.isArray(schema['x-schemock-routes'])) {
        return routes;
    }

    schema['x-schemock-routes'].forEach((routeDef: {
        path: string;
        method: string;
        response?: JSONValue | Schema;
        statusCode?: number;
        delay?: number;
        headers?: Record<string, string>
    }) => {
        const method = routeDef.method.toLowerCase();
        const path = routeDef.path;
        const key = `${method}:${path}`;

        routes[key] = {
            path,
            method: method as 'get' | 'post' | 'put' | 'delete' | 'patch',
            statusCode: routeDef.statusCode || (method === 'post' ? 201 : 200),
            delay: routeDef.delay || 0,
            headers: routeDef.headers || {},
            response: createHandler(method, path, routeDef),
            schema: routeDef.response && typeof routeDef.response === 'object' && 'type' in routeDef.response
                ? routeDef.response as Schema
                : undefined
        };
    });

    return routes;
}

/**
 * Generate default CRUD routes
 */
export function generateCrudRoutes(
    basePath: string,
    schema: Schema,
    createHandler: (method: string, path: string, routeDef: { response?: JSONValue | Schema }) => (req: RouteRequest, state: ServerState) => JSONValue
): Record<string, RouteConfig> {
    const routes: Record<string, RouteConfig> = {};

    const crudPaths = [
        { method: 'get', path: basePath },
        { method: 'get', path: `${basePath}/:id` },
        { method: 'post', path: basePath },
        { method: 'put', path: `${basePath}/:id` },
        { method: 'delete', path: `${basePath}/:id` }
    ];

    crudPaths.forEach(({ method, path }) => {
        const key = `${method}:${path}`;
        routes[key] = {
            path,
            method: method as 'get' | 'post' | 'put' | 'delete' | 'patch',
            statusCode: method === 'post' ? 201 : (method === 'delete' ? 204 : 200),
            response: createHandler(method, path, { response: schema }),
            schema: schema
        };
    });

    return routes;
}
