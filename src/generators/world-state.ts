import { JSONValue } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Foreign key field patterns → the resource they reference.
 * These are the most common patterns in REST APIs.
 * Extensible: add more as needed.
 */
const FK_PATTERNS: [RegExp, string][] = [
  [/^(author|authorId)$/i, 'users'],
  [/^userId$/i, 'users'],
  [/^ownerId$/i, 'users'],
  [/^customerId$/i, 'users'],
  [/^senderId$/i, 'users'],
  [/^recipientId$/i, 'users'],
  [/^categoryId$/i, 'categories'],
  [/^productId$/i, 'products'],
  [/^orderId$/i, 'orders'],
  [/^postId$/i, 'posts'],
  [/^commentId$/i, 'comments'],
  [/^articleId$/i, 'articles'],
  [/^imageId$/i, 'images'],
  [/^fileId$/i, 'files'],
  [/^tagId$/i, 'tags'],
  [/^roleId$/i, 'roles'],
  [/^permissionId$/i, 'permissions'],
  [/^teamId$/i, 'teams'],
  [/^organizationId$/i, 'organizations'],
  [/^orgId$/i, 'organizations'],
  [/^companyId$/i, 'organizations'],
  [/^workspaceId$/i, 'workspaces'],
  [/^projectId$/i, 'projects'],
];

/**
 * Normalizes a resource name to a consistent key.
 * "User" → "users", "user" → "users", "UserProfiles" → "userprofiles"
 */
function normalizeResource(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, '');
}

/**
 * Detects if a field name looks like a foreign key and returns the
 * referenced resource name, or null if it doesn't match any pattern.
 */
export function detectForeignKey(fieldName: string): string | null {
  const normalized = normalizeResource(fieldName);
  for (const [pattern, resource] of FK_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(fieldName)) {
      return resource;
    }
  }
  return null;
}

/**
 * Detects if a field name looks like an ID field (primary or foreign).
 */
export function isIdField(fieldName: string): boolean {
  const n = normalizeResource(fieldName);
  return n === 'id' || n === 'uuid' || /^(.+)(id|uuid)$/.test(n);
}

/**
 * Picks a plausible ID value for a foreign key field.
 * If the referenced resource already has entities, picks a random one.
 * Otherwise generates a fresh UUID.
 */
function generateFkValue(referencedResource: string, pool: Map<string, JSONValue>): string {
  const entities = Array.from(pool.values());
  if (entities.length === 0) {
    return uuidv4();
  }
  // Pick a random existing entity's ID
  const randomEntity = entities[Math.floor(Math.random() * entities.length)];
  if (randomEntity && typeof randomEntity === 'object' && 'id' in randomEntity) {
    return String((randomEntity as Record<string, JSONValue>).id);
  }
  return uuidv4();
}

export interface WorldStateOptions {
  /** Seed for reproducible ID generation */
  seed?: number;
  /** Pre-populate resources with N entities on init */
  prepopulateCount?: number;
}

/**
 * WorldState — semantic cross-resource entity store.
 *
 * Maintains a pool of generated entities per resource type, so that
 * foreign keys resolve to real IDs that actually exist in the mock world.
 *
 * Before:
 *   GET /posts returns [{ id: "abc", authorId: "xyz", title: "..." }]
 *   GET /users returns [{ id: "not-xyz", name: "..." }]
 *   → authorId "xyz" doesn't match any real user
 *
 * After:
 *   GET /posts returns [{ id: "abc", authorId: "user-1", title: "..." }]
 *   GET /users returns [{ id: "user-1", name: "Sarah Chen" }]
 *   → authorId "user-1" IS a real user in the world
 *
 * Usage:
 *   const world = new WorldState();
 *   world.register('users', { id: 'user-1', name: 'Sarah Chen' });
 *   const posts = world.generateWithRefs('posts', postSchema);
 *   // posts[0].authorId === 'user-1' (or another real user ID)
 */
export class WorldState {
  /** Pool of entities per resource, keyed by resource name */
  private pools: Map<string, Map<string, JSONValue>> = new Map();
  /** Entity counts for generating deterministic-ish IDs */
  private counters: Map<string, number> = new Map();

  constructor(private options: WorldStateOptions = {}) {}

  /**
   * Normalize a resource name to its pool key.
   * "users" → "users", "User" → "users", "blog_posts" → "blogposts"
   */
  private resolvePoolKey(resource: string): string {
    return normalizeResource(resource);
  }

  /**
   * Get the pool for a resource, creating it if needed.
   */
  pool(resource: string): Map<string, JSONValue> {
    const key = this.resolvePoolKey(resource);
    if (!this.pools.has(key)) {
      this.pools.set(key, new Map());
    }
    return this.pools.get(key)!;
  }

  /**
   * Check if a resource pool has any entities.
   */
  hasEntities(resource: string): boolean {
    return this.pool(resource).size > 0;
  }

  /**
   * Get all entity IDs for a resource.
   */
  getIds(resource: string): string[] {
    return Array.from(this.pool(resource).keys());
  }

  /**
   * Get a random entity from a resource pool.
   */
  getRandomEntity(resource: string): JSONValue | null {
    const entities = Array.from(this.pool(resource).values());
    if (entities.length === 0) return null;
    return entities[Math.floor(Math.random() * entities.length)];
  }

  /**
   * Get a specific entity by ID from a resource pool.
   */
  getById(resource: string, id: string): JSONValue | null {
    return this.pool(resource).get(id) ?? null;
  }

  /**
   * Register an entity to a resource pool.
   * If the entity has an `id` field, uses that as the key.
   * Otherwise generates a UUID and attaches it.
   */
  register(resource: string, entity: JSONValue): JSONValue {
    const p = this.pool(resource);
    const key = this.resolvePoolKey(resource);
    const count = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, count);

    if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
      const obj = entity as Record<string, JSONValue>;
      if (!obj.id) {
        // Generate a readable-ish ID for discovery
        obj.id = `${key.replace(/s$/, '')}-${count}`;
      }
      p.set(String(obj.id), obj);
      return obj;
    }

    // Non-object values stored by auto-generated key
    const id = `${key}-${count}`;
    p.set(id, entity);
    return entity;
  }

  /**
   * Resolve a foreign key value for a given field.
   *
   * If the referenced resource has entities, picks a random existing ID.
   * Otherwise generates a plausible UUID.
   *
   * @param fieldName  The field name, e.g. "authorId", "categoryId"
   * @param hints      Optional hints: schema, rootSchema for deeper resolution
   */
  resolveFk(fieldName: string): string {
    const ref = detectForeignKey(fieldName);
    if (!ref) {
      // Not a recognized FK — generate a UUID as fallback
      return uuidv4();
    }
    return generateFkValue(ref, this.pool(ref));
  }

  /**
   * Walk an object and replace foreign-key-ish fields with real IDs
   * from the world state.
   *
   * Call this on every generated entity before storing it.
   *
   * @param entity The generated entity object
   * @returns A new object with FK fields resolved to real IDs
   */
  resolveEntity(entity: JSONValue): JSONValue {
    if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
      return entity;
    }

    const result: Record<string, JSONValue> = { ...entity as Record<string, JSONValue> };

    for (const [key, value] of Object.entries(result)) {
      // Detect ID-like fields
      if (isIdField(key) && typeof value === 'string') {
        const ref = detectForeignKey(key);
        if (ref && this.hasEntities(ref)) {
          // Replace with a real ID from the world
          const realEntity = this.getRandomEntity(ref);
          if (realEntity && typeof realEntity === 'object' && 'id' in realEntity) {
            result[key] = String((realEntity as Record<string, JSONValue>).id);
          }
        }
      }

      // Recurse into nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.resolveEntity(value) as JSONValue;
      }
    }

    return result;
  }

  /**
   * Get a snapshot of all registered entity IDs per resource.
   * Useful for debugging and MCP introspection.
   */
  getSnapshot(): Record<string, string[]> {
    const snap: Record<string, string[]> = {};
    for (const [key, pool] of this.pools.entries()) {
      snap[key] = Array.from(pool.keys());
    }
    return snap;
  }

  /**
   * Clear all registered entities. Useful for test resets.
   */
  reset(): void {
    this.pools.clear();
    this.counters.clear();
  }

  /** Number of resources registered */
  get resourceCount(): number {
    return this.pools.size;
  }

  /** Total entity count across all resources */
  get totalEntities(): number {
    let total = 0;
    for (const p of this.pools.values()) total += p.size;
    return total;
  }
}
