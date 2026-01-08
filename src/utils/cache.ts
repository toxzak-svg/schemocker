/**
 * LRU Cache implementation for schema caching
 * Improves performance by avoiding repeated schema parsing
 */

interface CacheNode<T> {
  key: string;
  value: T;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
  timestamp: number;
}

export interface CacheOptions {
  maxSize: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Simple LRU (Least Recently Used) Cache implementation
 */
export class LRUCache<T> {
  private maxSize: number;
  private ttl?: number;
  private cache: Map<string, CacheNode<T>>;
  private head: CacheNode<T> | null;
  private tail: CacheNode<T> | null;

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const node = this.cache.get(key);
    
    if (!node) {
      return undefined;
    }

    // Check if entry has expired
    if (this.ttl && Date.now() - node.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    
    return node.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T): void {
    // Check if key already exists
    const existingNode = this.cache.get(key);
    
    if (existingNode) {
      // Update existing node
      existingNode.value = value;
      existingNode.timestamp = Date.now();
      this.moveToFront(existingNode);
      return;
    }

    // Create new node
    const newNode: CacheNode<T> = {
      key,
      value,
      prev: null,
      next: null,
      timestamp: Date.now()
    };

    // Add to cache
    this.cache.set(key, newNode);
    
    // Add to front of list
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }

    // Evict oldest entry if at capacity
    if (this.cache.size > this.maxSize) {
      this.evict();
    }
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    
    return true;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hasTTL: !!this.ttl
    };
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }

    // Check if entry has expired
    if (this.ttl && Date.now() - node.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Move a node to the front of the list
   */
  private moveToFront(node: CacheNode<T>): void {
    if (node === this.head) {
      return;
    }

    this.removeNode(node);

    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
  }

  /**
   * Remove a node from the list
   */
  private removeNode(node: CacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
  }

  /**
   * Evict the least recently used entry
   */
  private evict(): void {
    if (!this.tail) {
      return;
    }

    this.cache.delete(this.tail.key);
    this.removeNode(this.tail);
  }
}

/**
 * Create a hash key for schema caching
 */
export function createSchemaHash(schema: any): string {
  const str = JSON.stringify(schema);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(36);
}

/**
 * Create a cache key from schema and options
 */
export function createCacheKey(schema: any, options?: { strict?: boolean; [key: string]: any }): string {
  const schemaHash = createSchemaHash(schema);
  const optionsHash = options ? createSchemaHash(options) : '';
  return `${schemaHash}:${optionsHash}`;
}
