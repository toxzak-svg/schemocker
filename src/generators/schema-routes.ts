import { v4 as uuidv4 } from 'uuid';
import { SchemaParser } from '../parsers/schema';
import { WorldState, detectForeignKey, isIdField } from './world-state';
import { enrichField, isSemanticField } from './field-enricher';
import {
    RouteConfig,
    RouteRequest,
    ServerState,
    JSONValue,
    NonNullJSONValue,
    Schema
} from '../types';

// ServerState reserved key for world-state instance
const WORLD_KEY = '_world' as keyof ServerState;

type WorldStateStore = Record<string, unknown>;

/**
 * Lazily get or create the WorldState from a ServerState.
 * Stored on a reserved key so it persists across handler calls.
 */
function getWorld(state: ServerState): WorldState {
    const store = state as unknown as WorldStateStore;
    if (!store[WORLD_KEY]) {
        store[WORLD_KEY] = new WorldState();
    }
    return store[WORLD_KEY] as WorldState;
}

/**
 * Given a resource name (e.g. "users", "blog_posts") and a schema,
 * determines the appropriate resource key for the world state pool.
 *
 * "users" → "users", "userProfiles" → "users", "blogpost" → "blogposts"
 */
function worldResourceKey(resource: string): string {
    const r = resource.toLowerCase().replace(/[_-]/g, '');
    // Strip common suffixes
    return r.replace(/s$/, '');
}

/**
 * Wraps an entity with WorldState FK resolution and registration.
 *
 * 1. Detects and resolves FK fields (authorId, userId, etc.) to real IDs
 *    from the world state's entity pools
 * 2. Registers the entity so subsequent FK references can find it
 *
 * @param entity   The entity to process
 * @param resource The resource name (for world state pool key)
 * @param world    The WorldState instance
 * @returns The resolved entity with real FK IDs
 */
function resolveAndRegister(
    entity: JSONValue,
    resource: string,
    world: WorldState
): NonNullJSONValue {
    if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
        // Shouldn't happen for the call sites (objects only), but satisfy the type system
        return entity as NonNullJSONValue;
    }

    const obj = entity as Record<string, JSONValue>;
    const resolved = { ...obj };

    // Step 1: resolve FK fields → real IDs from the world
    for (const [key, value] of Object.entries(resolved)) {
        if (isIdField(key) && typeof value === 'string') {
            const ref = detectForeignKey(key);
            if (ref && world.hasEntities(ref)) {
                const realEntity = world.getRandomEntity(ref);
                if (realEntity && typeof realEntity === 'object' && 'id' in realEntity) {
                    resolved[key] = String((realEntity as Record<string, JSONValue>).id);
                }
            }
        }
    }

    // Step 2: register so future FK references can find this entity
    world.register(worldResourceKey(resource), resolved);

    return resolved as NonNullJSONValue;
}

/**
 * Determines the resource name from schema title or options
 *
 * @param schema - The JSON Schema to extract the resource name from
 * @param options - Options containing an optional explicit resource name
 * @returns The resource name to use for API routes
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
 * Determines the base API path for routes
 *
 * @param resourceName - The resource name to use in the path
 * @param options - Options containing an optional explicit base path
 * @returns The base path for API routes (e.g., /api/users)
 */
export function determineBasePath(resourceName: string, options: { basePath?: string }): string {
    return options.basePath || `/api/${resourceName}`;
}

/**
 * Type guard to check if a response definition is a Schema
 *
 * @param response - The response value to check
 * @returns True if the response is a Schema object
 */
function isSchemaResponse(response: JSONValue | Schema): response is Schema {
    return typeof response === 'object' && response !== null &&
        ('type' in response || '$ref' in response || 'oneOf' in response ||
            'anyOf' in response || 'allOf' in response);
}

/**
 * Initializes the resource state array if it doesn't exist
 *
 * @param state - The server state object to update
 * @param resource - The resource key to initialize
 */
function initializeResourceState(state: ServerState, resource: string): void {
    if (!state[resource]) {
        state[resource] = [];
    }
}

/**
 * Handles GET request for a single item by ID
 *
 * @param state - The server state containing stored resources
 * @param resource - The resource name to retrieve from
 * @param req - The route request object containing params
 * @param responseSchema - The schema for generating mock data
 * @param mainSchema - The main schema for reference
 * @param options - Options including strict mode flag
 * @param wrap - Whether to wrap the response in a success envelope
 * @returns The requested item or a generated mock item
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
    const world = getWorld(state);

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

    // Fallback: generate, tie to ID, store, and register with world
    let data = SchemaParser.parse(responseSchema, mainSchema, new Set(), options.strict, resource);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const dataObj = data as Record<string, JSONValue>;
        if (req.params?.id) {
            dataObj.id = req.params.id;
        }
        // Resolve FKs and register with world state
        const resolved = resolveAndRegister(dataObj, resource, world);
        state[resource].push(resolved);
        data = resolved;
    }

    return wrap ? {
        success: true,
        message: 'Mock data generated',
        timestamp: new Date().toISOString(),
        data
    } : data;
}

/**
 * Asynchronously enriches stored records with AI-generated semantic content.
 * Runs in the background — does not block the response.
 * The next GET request will return enriched data from state.
 */
function backgroundEnrichRecords(
    state: ServerState,
    resource: string,
    mainSchema: Schema
): void {
    const records = state[resource];
    if (!records || records.length === 0) return;

    // Check if AI is likely configured before firing off async work
    const sample = records[0];
    if (typeof sample !== 'object' || sample === null) return;

    const hasSemanticFields = Object.keys(sample as Record<string, JSONValue>).some(k => isSemanticField(k));
    if (!hasSemanticFields) return;

    // Fire and forget — enrich in background, don't block response
    (async () => {
        try {
            for (const record of records) {
                if (typeof record !== 'object' || record === null) continue;
                const obj = record as Record<string, JSONValue>;
                for (const key of Object.keys(obj)) {
                    if (typeof obj[key] === 'string' && isSemanticField(key)) {
                        const enriched = await enrichField(key, obj as Record<string, unknown>);
                        if (enriched) {
                            obj[key] = enriched;
                        }
                    }
                }
            }
        } catch (err) {
            // Silently ignore enrichment errors — faker data is still valid
            console.warn(`Background enrichment failed for ${resource}: ${err instanceof Error ? err.message : String(err)}`);
        }
    })();
}

/**
 * Handles GET request for a collection of items
 *
 * @param state - The server state containing stored resources
 * @param resource - The resource name to retrieve from
 * @param responseSchema - The schema for generating mock data
 * @param mainSchema - The main schema for reference
 * @param options - Options including strict mode flag
 * @param wrap - Whether to wrap the response in a success envelope
 * @returns The collection of items with optional metadata
 */
function handleGetCollection(
    state: ServerState,
    resource: string,
    responseSchema: Schema,
    mainSchema: Schema,
    options: { strict?: boolean },
    wrap: boolean
): JSONValue {
    const world = getWorld(state);

    // Return list from state
    if (state[resource].length === 0) {
        // Populate with initial data, resolving FKs for each entity
        const generated = SchemaParser.parse(responseSchema, mainSchema, new Set(), options.strict, resource);
        if (Array.isArray(generated)) {
            state[resource] = generated.map(item =>
                resolveAndRegister(item, resource, world)
            );
        } else {
            for (let i = 0; i < 3; i++) {
                const item = SchemaParser.parse(responseSchema, mainSchema, new Set(), options.strict, resource);
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    const itemObj = item as Record<string, JSONValue>;
                    if (!itemObj.id) {
                        itemObj.id = `${worldResourceKey(resource)}-${i + 1}`;
                    }
                    const resolved = resolveAndRegister(itemObj, resource, world);
                    state[resource].push(resolved);
                }
            }
        }
    }

    // Kick off background AI enrichment — does not block the response
    // The next GET request will return enriched (AI-generated) values
    backgroundEnrichRecords(state, resource, mainSchema);

    return wrap ? {
        success: true,
        message: 'Mock data retrieved',
        timestamp: new Date().toISOString(),
        data: state[resource],
        meta: { total: state[resource].length }
    } : state[resource];
}

/**
 * Handles POST request to create a new item
 *
 * @param state - The server state containing stored resources
 * @param resource - The resource name to add to
 * @param req - The route request object containing the body
 * @param wrap - Whether to wrap the response in a success envelope
 * @returns The created item with generated ID and timestamps
 */
function handlePost(
    state: ServerState,
    resource: string,
    req: RouteRequest,
    wrap: boolean
): JSONValue {
    const world = getWorld(state);
    const bodyObj = typeof req.body === 'object' && req.body !== null ? req.body as Record<string, unknown> : {};

    const newItem: Record<string, JSONValue> = {
        id: (bodyObj.id as string) || uuidv4(),
        ...bodyObj as Record<string, JSONValue>,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Resolve FKs and register with world state
    const resolved = resolveAndRegister(newItem, resource, world);
    state[resource].push(resolved);

    return wrap ? { success: true, data: resolved, message: 'Created successfully' } : resolved;
}

/**
 * Handles PUT request to update an existing item
 *
 * @param state - The server state containing stored resources
 * @param resource - The resource name to update in
 * @param req - The route request object containing params and body
 * @param wrap - Whether to wrap the response in a success envelope
 * @returns The updated item
 */
function handlePut(
    state: ServerState,
    resource: string,
    req: RouteRequest,
    wrap: boolean
): JSONValue {
    const world = getWorld(state);
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

    // Resolve FKs and register with world state
    const resolved = resolveAndRegister(updatedItem, resource, world);

    if (index >= 0) {
        state[resource][index] = resolved;
    } else {
        state[resource].push(resolved);
    }

    return wrap ? { success: true, data: resolved } : resolved;
}

/**
 * Handles DELETE request to remove an item
 *
 * @param state - The server state containing stored resources
 * @param resource - The resource name to delete from
 * @param req - The route request object containing params
 * @param wrap - Whether to wrap the response in a success envelope
 * @returns A success message
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
 * Creates a route handler function for a specific method and path
 *
 * @param method - The HTTP method (get, post, put, delete, patch)
 * @param routePath - The route path
 * @param routeDef - The route definition containing response schema
 * @param mainSchema - The main schema for reference
 * @param options - Options including strict mode flag
 * @param wrap - Whether to wrap responses in a success envelope
 * @returns A route handler function
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
 * Generates custom routes from the x-schemock-routes schema extension
 *
 * @param schema - The JSON Schema containing x-schemock-routes definitions
 * @param createHandler - Factory function to create route handlers
 * @returns A record of route configurations keyed by method:path
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
 * Generates default CRUD routes for a resource
 *
 * Creates GET (collection), GET (by ID), POST, PUT, and DELETE routes
 * for the specified base path.
 *
 * @param basePath - The base path for the resource (e.g., /api/users)
 * @param schema - The JSON Schema for the resource
 * @param createHandler - Factory function to create route handlers
 * @returns A record of route configurations keyed by method:path
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
