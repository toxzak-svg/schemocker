/**
 * Centralized constants for Schemock
 * Eliminates magic numbers and strings throughout the codebase
 */

// Server defaults
export const DEFAULT_PORT = 3000;
export const DEFAULT_LOG_LEVEL = 'info' as const;
export const DEFAULT_CORS_ENABLED = true;
export const DEFAULT_SCENARIO = 'happy-path' as const;

// Request/response defaults
export const DEFAULT_STATUS_CODE_SUCCESS = 200;
export const DEFAULT_STATUS_CODE_CREATED = 201;
export const DEFAULT_STATUS_CODE_NO_CONTENT = 204;
export const DEFAULT_STATUS_CODE_ERROR = 500;

// Timing and delays
export const DEFAULT_ROUTE_DELAY = 0;
export const SCENARIO_SLOW_MIN_DELAY = 1000;
export const SCENARIO_SLOW_MAX_DELAY = 3000;
export const WATCHER_STABILITY_THRESHOLD = 500;
export const WATCHER_POLL_INTERVAL = 100;

// Error probabilities
export const SCENARIO_ERROR_PROBABILITY = 0.3;
export const ERROR_STATUS_CODES = [400, 401, 403, 404, 500, 503] as const;

// Logging
export const DEFAULT_MAX_LOG_LENGTH = 1000;
export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export const LOG_LEVEL_PADDING = 5;
export const LOG_CONTEXT_SEPARATOR = ' | ';

// Validation
export const MIN_PORT = 1;
export const MAX_PORT = 65535;
export const PRIVILEGED_PORT_THRESHOLD = 1024;
export const DEFAULT_MIN_STRING_LENGTH = 0;
export const DEFAULT_MAX_STRING_LENGTH = 10;
export const DEFAULT_ARRAY_MIN_ITEMS = 1;
export const DEFAULT_ARRAY_MAX_ITEMS = 5;
export const DEFAULT_COLLECTION_SIZE = 3;
export const MAX_PROJECT_NAME_LENGTH = 100;

// Schema parsing
export const MAX_SCHEMA_DEPTH = 10;
export const MAX_ARRAY_ITEMS = 100;
export const MIN_ARRAY_ITEMS_STRICT = 1;

// Heuristics data
export const MOCK_EMAIL_DOMAIN = 'example.com';
export const MOCK_NAMES = {
  first: ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'],
  last: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor'],
  full: ['John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Brown'],
  cities: ['New York', 'London', 'Paris', 'Tokyo', 'Berlin'],
  countries: ['USA', 'UK', 'France', 'Japan', 'Germany'],
  companies: ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech'],
  titles: ['Project Alpha', 'Awesome Feature', 'New Release', 'Bug Fix']
} as const;

export const MOCK_DESCRIPTIONS = {
  generic: 'A comprehensive description of the resource with all necessary details.',
  user_profile: 'User account information and settings'
} as const;

// Response templates
export const RESPONSE_TEMPLATES = {
  success: {
    success: true,
    message: 'Mock data retrieved',
    timestamp: null
  },
  created: {
    success: true,
    data: null,
    message: 'Created successfully'
  },
  deleted: {
    success: true,
    message: 'Deleted successfully'
  },
  error: {
    success: false,
    error: 'Internal Server Error',
    message: 'An error occurred'
  },
  validation_error: {
    success: false,
    error: 'ValidationError',
    message: null
  }
} as const;

// State management
export const DEFAULT_RESOURCE_STATE_KEY = 'data';

// File system
export const DEFAULT_SCHEMA_EXTENSION = '.json';
export const EXECUTABLE_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.sh', '.bash'] as const;

// Security
export const DANGEROUS_PATH_PATTERNS = [
  '..',
  '~',
  '$',
  '%',
  '\\\\?\\',
  'file://',
  '__proto__',
  'constructor',
  'prototype'
] as const;

// Branding
export const POWERED_BY_HEADER = 'X-Powered-By';
export const BRANDING_METADATA_KEY = '_meta';

// Performance
export const MAX_BODY_SIZE = '10mb';
export const DEFAULT_CACHE_SIZE = 100;
export const CACHE_TTL = 300000; // 5 minutes

// Test constants
export const TEST_TIMEOUT = 10000;

// Error codes
export const ERROR_CODES = {
  CONFIGURATION: 'E001',
  SCHEMA_PARSE: 'E100',
  SCHEMA_REF: 'E101',
  SERVER: 'E200',
  PORT: 'E201',
  FILE: 'E300',
  VALIDATION: 'E400'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // File watching errors
  CHOKIDAR_NOT_AVAILABLE: 'Chokidar not available, file watching disabled',
  FILE_WATCHING_NOT_AVAILABLE: 'File watching is not available in this environment',
  FILE_WATCHER_ERROR: 'File watcher error',

  // Validation errors
  PORT_REQUIRES_ELEVATED_PRIVILEGES: 'Port requires elevated privileges on Unix-like systems',
  FILE_NOT_FOUND: 'File not found',
  MISSING_REQUIRED_FIELD: 'Missing required field',

  // Schema errors
  SCHEMA_MUST_BE_OBJECT: 'Schema must be a valid object',
  SCHEMA_MUST_HAVE_TYPE_OR_COMPOSITION: 'Schema must have a type or composition keyword (oneOf, anyOf, allOf, $ref)',
  INVALID_SCHEMA_TYPE: 'Invalid schema type',

  // Type validation errors
  EXPECTED_STRING: 'Expected string',
  EXPECTED_NUMBER: 'Expected number',
  EXPECTED_BOOLEAN: 'Expected boolean',
  EXPECTED_OBJECT: 'Expected object',
  EXPECTED_ARRAY: 'Expected array',

  // Constraint errors
  STRING_TOO_SHORT: 'String too short',
  STRING_TOO_LONG: 'String too long',
  NUMBER_TOO_SMALL: 'Number too small',
  NUMBER_TOO_LARGE: 'Number too large'
} as const;
