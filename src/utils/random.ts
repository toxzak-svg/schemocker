/**
 * Seeded Random Number Generator
 * Provides consistent random number generation for testing and reproducible results
 * Falls back to Math.random() when no seed is provided for production use
 */

export class SeededRandom {
    private seed: number;
    private current: number;

    constructor(seed?: number) {
        if (seed !== undefined) {
            this.seed = seed;
            this.current = seed;
        } else {
            // Use current time as seed when not provided
            this.seed = Date.now();
            this.current = this.seed;
        }
    }

    /**
     * Generate a random number between 0 (inclusive) and 1 (exclusive)
     */
    next(): number {
        // Linear Congruential Generator (LCG)
        // Using constants from glibc for good distribution
        this.current = (this.current * 1103515245 + 12345) & 0x7fffffff;
        return this.current / 0x7fffffff;
    }

    /**
     * Generate a random integer between min (inclusive) and max (inclusive)
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate a random float between min (inclusive) and max (exclusive)
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * Reset the generator to its initial seed
     */
    reset(): void {
        this.current = this.seed;
    }

    /**
     * Set a new seed
     */
    setSeed(seed: number): void {
        this.seed = seed;
        this.current = seed;
    }
}

/**
 * Global random generator instance
 * Can be seeded for testing, uses Math.random() by default for production
 */
let globalRandomGenerator: SeededRandom | null = null;
let useSeededRandom = false;

/**
 * Initialize the global random generator with a seed
 * Call this in tests to ensure reproducible results
 */
export function initRandomGenerator(seed?: number): void {
    if (seed !== undefined) {
        globalRandomGenerator = new SeededRandom(seed);
        useSeededRandom = true;
    } else {
        globalRandomGenerator = null;
        useSeededRandom = false;
    }
}

/**
 * Reset the global random generator to its initial seed
 */
export function resetRandomGenerator(): void {
    if (globalRandomGenerator) {
        globalRandomGenerator.reset();
    }
}

/**
 * Generate a random number between 0 (inclusive) and 1 (exclusive)
 * Uses seeded generator if initialized, otherwise falls back to Math.random()
 */
export function random(): number {
    if (useSeededRandom && globalRandomGenerator) {
        return globalRandomGenerator.next();
    }
    return Math.random();
}

/**
 * Generate a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
    if (useSeededRandom && globalRandomGenerator) {
        return globalRandomGenerator.nextInt(min, max);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min (inclusive) and max (exclusive)
 */
export function randomFloat(min: number, max: number): number {
    if (useSeededRandom && globalRandomGenerator) {
        return globalRandomGenerator.nextFloat(min, max);
    }
    return Math.random() * (max - min) + min;
}
