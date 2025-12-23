# Schemock User Guide

## Getting Started

Welcome to Schemock! This guide will walk you through creating mock APIs from JSON schemas with step-by-step tutorials and practical examples.

## Quick Start

### Your First Mock Server (5 Minutes)

Let's create a simple mock server for a user management API.

#### Step 1: Create a Schema

Create a file named `user-schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User Management API",
  "description": "Schema for user management operations",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique user identifier"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Full name of the user"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "User email address"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 120,
      "description": "User age in years"
    },
    "isActive": {
      "type": "boolean",
      "default": true,
      "description": "Whether the user account is active"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Account creation timestamp"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 1,
      "maxItems": 5,
      "description": "User tags for categorization"
    }
  },
  "required": ["id", "name", "email", "isActive", "createdAt"]
}
```

#### Step 2: Start the Server

Open your terminal and run:

```bash
schemock start user-schema.json --log-level info
```

You should see output like this:

```
🚀 Starting mock server on port 3000...
🔌 CORS: enabled
📝 Log level: info
📄 Using schema: /path/to/user-schema.json
✅ Server running at http://localhost:3000
🛑 Press Ctrl+C to stop the server
```

#### Step 3: Test the API

Open your browser or use curl to test the endpoints:

```bash
# Get mock user data
curl http://localhost:3000/api/data

# Send data to the echo endpoint
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "message": "Hello"}'
```

## Tutorial: Building a Complete Mock API

Let's build a comprehensive mock API for an e-commerce system.

### Tutorial 1: Product Management API

#### Step 1: Project Setup

```bash
# Create project directory
mkdir ecommerce-mock-api
cd ecommerce-mock-api

# Initialize npm project
npm init -y

# Install schemock
npm install schemock

# Create schemas directory
mkdir schemas
```

#### Step 2: Create Product Schema

Create `schemas/product-schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Product",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Product unique identifier"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Product name"
    },
    "description": {
      "type": "string",
      "maxLength": 1000,
      "description": "Product description"
    },
    "price": {
      "type": "number",
      "minimum": 0,
      "multipleOf": 0.01,
      "description": "Product price in USD"
    },
    "category": {
      "type": "string",
      "enum": ["electronics", "clothing", "books", "home", "sports"],
      "description": "Product category"
    },
    "inStock": {
      "type": "boolean",
      "description": "Whether the product is in stock"
    },
    "quantity": {
      "type": "integer",
      "minimum": 0,
      "description": "Available quantity"
    },
    "images": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uri"
      },
      "minItems": 1,
      "maxItems": 5,
      "description": "Product image URLs"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp"
    }
  },
  "required": ["id", "name", "price", "category", "inStock", "createdAt"]
}
```

#### Step 3: Create Custom Server Configuration

Create `server.js`:

```javascript
const { createMockServer } = require('schemock');
const fs = require('fs');
const path = require('path');

// Load product schema
const productSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas/product-schema.json'), 'utf8')
);

// Create mock product data
const mockProducts = Array.from({ length: 10 }, (_, index) => ({
  id: `product-${index + 1}`,
  name: `Product ${index + 1}`,
  description: `Description for product ${index + 1}`,
  price: (index + 1) * 10.99,
  category: ['electronics', 'clothing', 'books', 'home', 'sports'][index % 5],
  inStock: Math.random() > 0.3,
  quantity: Math.floor(Math.random() * 100) + 1,
  images: [
    `https://example.com/images/product-${index + 1}-1.jpg`,
    `https://example.com/images/product-${index + 1}-2.jpg`
  ],
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
}));

// Create server configuration
const config = {
  server: {
    port: 3000,
    cors: true,
    logLevel: 'info'
  },
  routes: {
    // GET /api/products - List all products
    'get:/api/products': {
      path: '/api/products',
      method: 'get',
      response: (req) => {
        const { page = 1, limit = 10, category, search } = req.query;
        let filteredProducts = mockProducts;
        
        // Filter by category
        if (category) {
          filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        
        // Filter by search term
        if (search) {
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        return {
          products: paginatedProducts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredProducts.length,
            pages: Math.ceil(filteredProducts.length / limit)
          }
        };
      }
    },
    
    // GET /api/products/:id - Get product by ID
    'get:/api/products/:id': {
      path: '/api/products/:id',
      method: 'get',
      response: (req) => {
        const product = mockProducts.find(p => p.id === req.params.id);
        if (!product) {
          return { error: 'Product not found', code: 404 };
        }
        return product;
      },
      statusCode: (req) => {
        const product = mockProducts.find(p => p.id === req.params.id);
        return product ? 200 : 404;
      }
    },
    
    // POST /api/products - Create new product
    'post:/api/products': {
      path: '/api/products',
      method: 'post',
      response: (req) => {
        const newProduct = {
          id: `product-${mockProducts.length + 1}`,
          ...req.body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockProducts.push(newProduct);
        return {
          message: 'Product created successfully',
          product: newProduct
        };
      },
      statusCode: 201
    },
    
    // PUT /api/products/:id - Update product
    'put:/api/products/:id': {
      path: '/api/products/:id',
      method: 'put',
      response: (req) => {
        const index = mockProducts.findIndex(p => p.id === req.params.id);
        if (index === -1) {
          return { error: 'Product not found', code: 404 };
        }
        
        mockProducts[index] = {
          ...mockProducts[index],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        
        return {
          message: 'Product updated successfully',
          product: mockProducts[index]
        };
      }
    },
    
    // DELETE /api/products/:id - Delete product
    'delete:/api/products/:id': {
      path: '/api/products/:id',
      method: 'delete',
      response: (req) => {
        const index = mockProducts.findIndex(p => p.id === req.params.id);
        if (index === -1) {
          return { error: 'Product not found', code: 404 };
        }
        
        const deletedProduct = mockProducts.splice(index, 1)[0];
        return {
          message: 'Product deleted successfully',
          product: deletedProduct
        };
      }
    },
    
    // GET /api/categories - List categories
    'get:/api/categories': {
      path: '/api/categories',
      method: 'get',
      response: () => ({
        categories: [
          { id: 'electronics', name: 'Electronics', count: 0 },
          { id: 'clothing', name: 'Clothing', count: 0 },
          { id: 'books', name: 'Books', count: 0 },
          { id: 'home', name: 'Home & Garden', count: 0 },
          { id: 'sports', name: 'Sports & Outdoors', count: 0 }
        ]
      })
    }
  }
};

// Create and start server
const server = createMockServer(productSchema, config.server);

// Add custom routes
const app = server.getApp();
Object.entries(config.routes).forEach(([key, routeConfig]) => {
  app[routeConfig.method](routeConfig.path, routeConfig.response);
});

server.start();
```

#### Step 4: Add Scripts to package.json

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "schemock start schemas/product-schema.json --log-level debug"
  }
}
```

#### Step 5: Test the API

```bash
# Start the server
npm start

# Test endpoints in another terminal
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/product-1
curl http://localhost:3000/api/categories
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "New Product", "price": 29.99, "category": "electronics"}'
```

## Tutorial 2: Multi-Endpoint User Management System

### Step 1: Create User Schema

Create `schemas/user-schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User Management System",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "username": { 
      "type": "string", 
      "minLength": 3, 
      "maxLength": 30,
      "pattern": "^[a-zA-Z0-9_]+$"
    },
    "email": { "type": "string", "format": "email" },
    "firstName": { "type": "string", "minLength": 1, "maxLength": 50 },
    "lastName": { "type": "string", "minLength": 1, "maxLength": 50 },
    "role": {
      "type": "string",
      "enum": ["admin", "user", "moderator", "guest"]
    },
    "profile": {
      "type": "object",
      "properties": {
        "bio": { "type": "string", "maxLength": 500 },
        "avatar": { "type": "string", "format": "uri" },
        "location": { "type": "string", "maxLength": 100 },
        "website": { "type": "string", "format": "uri" }
      }
    },
    "preferences": {
      "type": "object",
      "properties": {
        "theme": { "type": "string", "enum": ["light", "dark", "auto"] },
        "language": { "type": "string", "pattern": "^[a-z]{2}-[A-Z]{2}$" },
        "notifications": { "type": "boolean" }
      }
    },
    "isActive": { "type": "boolean" },
    "lastLogin": { "type": "string", "format": "date-time" },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "username", "email", "firstName", "lastName", "role", "isActive", "createdAt"]
}
```

### Step 2: Create Advanced User Server

Create `user-server.js`:

```javascript
const { createMockServer } = require('schemock');
const fs = require('fs');
const path = require('path');

// Load user schema
const userSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas/user-schema.json'), 'utf8')
);

// Mock user database
let users = [
  {
    id: 'user-1',
    username: 'johndoe',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    profile: {
      bio: 'Software developer and tech enthusiast',
      avatar: 'https://example.com/avatars/john.jpg',
      location: 'San Francisco, CA',
      website: 'https://johndoe.dev'
    },
    preferences: {
      theme: 'dark',
      language: 'en-US',
      notifications: true
    },
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2023-01-15T10:30:00.000Z'
  }
];

let nextUserId = 2;

// Helper functions
const generateId = () => `user-${nextUserId++}`;
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username) => /^[a-zA-Z0-9_]+$/.test(username);

// Create server
const server = createMockServer(userSchema, {
  port: 3001,
  cors: true,
  logLevel: 'info'
});

const app = server.getApp();

// User management routes
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  let filteredUsers = users;
  
  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }
  
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredUsers = filteredUsers.filter(u =>
      u.username.toLowerCase().includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm)
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  res.json({
    users: paginatedUsers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredUsers.length,
      pages: Math.ceil(filteredUsers.length / limit)
    }
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { username, email, firstName, lastName, role } = req.body;
  
  // Validation
  if (!username || !email || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!validateUsername(username)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }
  
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  const newUser = {
    id: generateId(),
    username,
    email,
    firstName,
    lastName,
    role: role || 'user',
    profile: req.body.profile || {},
    preferences: req.body.preferences || {
      theme: 'light',
      language: 'en-US',
      notifications: true
    },
    isActive: true,
    lastLogin: null,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
});

app.put('/api/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updates = req.body;
  const updatedUser = {
    ...users[userIndex],
    ...updates,
    id: users[userIndex].id, // Preserve ID
    createdAt: users[userIndex].createdAt // Preserve creation time
  };
  
  users[userIndex] = updatedUser;
  res.json({
    message: 'User updated successfully',
    user: updatedUser
  });
});

app.delete('/api/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  res.json({
    message: 'User deleted successfully',
    user: deletedUser
  });
});

// Authentication mock endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Mock authentication (accept any password)
  user.lastLogin = new Date().toISOString();
  
  res.json({
    message: 'Login successful',
    token: 'mock-jwt-token',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// Profile management
app.get('/api/users/:id/profile', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user.profile);
});

app.put('/api/users/:id/profile', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users[userIndex].profile = {
    ...users[userIndex].profile,
    ...req.body
  };
  
  res.json({
    message: 'Profile updated successfully',
    profile: users[userIndex].profile
  });
});

// Statistics endpoint
app.get('/api/stats', (req, res) => {
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    usersByRole: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      moderator: users.filter(u => u.role === 'moderator').length,
      guest: users.filter(u => u.role === 'guest').length
    },
    recentLogins: users
      .filter(u => u.lastLogin)
      .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
      .slice(0, 5)
      .map(u => ({ id: u.id, username: u.username, lastLogin: u.lastLogin }))
  };
  
  res.json(stats);
});

// Start server
server.start();
```

### Step 3: Test the User Management System

```bash
# Start the server
node user-server.js

# Test endpoints
curl http://localhost:3001/api/users
curl http://localhost:3001/api/stats

# Create a new user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "janedoe",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "user"
  }'

# Mock login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "password"}'
```

## Advanced Features

### Working with Delays and Realistic Responses

Add realistic delays to simulate network latency:

```javascript
'delayed:/api/slow-endpoint': {
  path: '/api/slow-endpoint',
  method: 'get',
  response: { message: 'This response is delayed' },
  delay: 2000, // 2 seconds
  headers: {
    'X-Delay': '2000ms',
    'Cache-Control': 'no-cache'
  }
}
```

### Error Simulation

Create routes that return errors for testing:

```javascript
app.get('/api/error-test/:type', (req, res) => {
  const { type } = req.params;
  
  switch (type) {
    case '404':
      return res.status(404).json({ error: 'Resource not found' });
    case '500':
      return res.status(500).json({ error: 'Internal server error' });
    case '401':
      return res.status(401).json({ error: 'Unauthorized' });
    case '403':
      return res.status(403).json({ error: 'Forbidden' });
    case '429':
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: 60 
      });
    default:
      res.json({ message: 'Normal response' });
  }
});
```

### Data Persistence Between Requests

Use in-memory storage for more realistic behavior:

```javascript
// Mock database
let database = {
  users: [],
  products: [],
  orders: []
};

// Auto-incrementing IDs
let counters = {
  users: 1,
  products: 1,
  orders: 1
};

// Helper to generate IDs
const generateId = (type) => {
  const id = `${type}-${counters[type]}`;
  counters[type]++;
  return id;
};
```

## Best Practices

### 1. Schema Design
- Use descriptive titles and descriptions
- Define appropriate constraints (minLength, maxLength, etc.)
- Use proper formats for common data types
- Organize complex schemas with nested objects

### 2. Route Organization
- Group related endpoints under consistent paths
- Use RESTful conventions (GET/POST/PUT/DELETE)
- Implement proper HTTP status codes
- Provide meaningful error messages

### 3. Data Generation
- Make mock data realistic but consistent
- Use proper data formats (emails, URLs, dates)
- Implement relationships between data entities
- Add variety to test different scenarios

### 4. Testing Integration
- Test both success and error scenarios
- Verify data validation
- Check authentication and authorization
- Test edge cases and boundary conditions

## Next Steps

Now that you've mastered the basics, explore:

1. **Advanced Schema Features**: Learn about oneOf, anyOf, allOf compositions
2. **Custom Response Generators**: Create dynamic responses based on request parameters
3. **Integration Testing**: Use Schemock in your test suites
4. **API Documentation**: Generate OpenAPI specifications from your schemas
5. **Performance Testing**: Create realistic load testing scenarios

For more examples and advanced features, check out the [API Documentation](./api-documentation.md) and [Technical Specifications](./technical-specifications.md).