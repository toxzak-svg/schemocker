import { generateRouteConfigs, generateRoutes, generateCRUDDSL } from '../src/generators/routes';
import { Schema } from '../src/types';

describe('Routes Generator', () => {
  describe('generateRouteConfigs', () => {
    it('should generate route configs from schema with title', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      const routes = generateRouteConfigs(schema);

      expect(routes).toBeDefined();
      expect(routes['get:/api/users']).toBeDefined();
      expect(routes['get:/api/users/:id']).toBeDefined();
      expect(routes['post:/api/users']).toBeDefined();
      expect(routes['put:/api/users/:id']).toBeDefined();
      expect(routes['delete:/api/users/:id']).toBeDefined();
    });

    it('should use "items" as default resource name when title is missing', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const routes = generateRouteConfigs(schema);

      expect(routes['get:/api/items']).toBeDefined();
      expect(routes['get:/api/items/:id']).toBeDefined();
    });

    it('should generate GET all items route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const getRoute = routes['get:/api/products'];

      expect(getRoute).toBeDefined();
      expect(getRoute.method).toBe('get');
      expect(getRoute.path).toBe('/api/products');
      expect(typeof getRoute.response).toBe('function');
    });

    it('should generate GET by ID route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const getRoute = routes['get:/api/products/:id'];

      expect(getRoute).toBeDefined();
      expect(getRoute.method).toBe('get');
      expect(getRoute.path).toBe('/api/products/:id');
      expect(typeof getRoute.response).toBe('function');
    });

    it('should generate POST route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const postRoute = routes['post:/api/products'];

      expect(postRoute).toBeDefined();
      expect(postRoute.method).toBe('post');
      expect(postRoute.path).toBe('/api/products');
    });

    it('should generate PUT route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const putRoute = routes['put:/api/products/:id'];

      expect(putRoute).toBeDefined();
      expect(putRoute.method).toBe('put');
      expect(putRoute.path).toBe('/api/products/:id');
    });

    it('should generate DELETE route', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routes = generateRouteConfigs(schema);
      const deleteRoute = routes['delete:/api/products/:id'];

      expect(deleteRoute).toBeDefined();
      expect(deleteRoute.method).toBe('delete');
      expect(deleteRoute.path).toBe('/api/products/:id');
    });

    it('should call GET handler with request object', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const getRoute = routes['get:/api/users/:id'];
      const mockReq = { params: { id: '123' } };

      const response = getRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('id', '123');
    });

    it('should call POST handler with request body', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const postRoute = routes['post:/api/users'];
      const mockReq = { body: { name: 'Test User' } };

      const response = postRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('name', 'Test User');
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');
    });

    it('should call PUT handler with request body', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const putRoute = routes['put:/api/users/:id'];
      const mockReq = {
        params: { id: '123' },
        body: { name: 'Updated User' }
      };

      const response = putRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('id', '123');
      expect(response.data).toHaveProperty('name', 'Updated User');
      expect(response.data).toHaveProperty('updatedAt');
    });

    it('should call DELETE handler with request params', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User'
      };

      const routes = generateRouteConfigs(schema);
      const deleteRoute = routes['delete:/api/users/:id'];
      const mockReq = { params: { id: '123' } };

      const response = deleteRoute.response(mockReq);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('id', '123');
      expect(response).toHaveProperty('message');
    });
  });

  describe('generateRoutes', () => {
    it('should generate Express router code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'User',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toBeDefined();
      expect(typeof routerCode).toBe('string');
      expect(routerCode).toContain("const express = require('express')");
      expect(routerCode).toContain("const router = express.Router()");
      expect(routerCode).toContain("const { v4: uuidv4 } = require('uuid')");
      expect(routerCode).toContain("let db = []");
      expect(routerCode).toContain("router.get('/'");
      expect(routerCode).toContain("router.get('/:id'");
      expect(routerCode).toContain("router.post('/'");
      expect(routerCode).toContain("router.put('/:id'");
      expect(routerCode).toContain("router.delete('/:id'");
    });

    it('should include GET all route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.get('/'");
      expect(routerCode).toContain('success: true');
      expect(routerCode).toContain('meta:');
    });

    it('should include GET by ID route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.get('/:id'");
      expect(routerCode).toContain('req.params.id');
      expect(routerCode).toContain('status(404)');
    });

    it('should include POST route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.post('/'");
      expect(routerCode).toContain('uuidv4()');
      expect(routerCode).toContain('createdAt');
      expect(routerCode).toContain('status(201)');
    });

    it('should include PUT route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.put('/:id'");
      expect(routerCode).toContain('updatedAt');
      expect(routerCode).toContain('req.params.id');
    });

    it('should include DELETE route in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Product'
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain("router.delete('/:id'");
      expect(routerCode).toContain('status(204)');
      expect(routerCode).toContain('req.params.id');
    });

    it('should use correct pluralization in generated code', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Category'
      };

      const routerCode = generateRoutes(schema);

      // Should now use smart pluralization: Category -> categories
      expect(routerCode).toContain('/api/categories');
      expect(routerCode).toContain('category');
    });

    it('should handle schema without title', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain('items');
      expect(routerCode).toContain('/api/items');
    });

    it('should handle schema with title "Item"', () => {
      const schema: Schema = {
        type: 'object',
        title: 'Item',
        properties: {
          id: { type: 'string' }
        }
      };

      const routerCode = generateRoutes(schema);

      expect(routerCode).toContain('items');
      expect(routerCode).toContain('/api/items');
    });
  });

  describe('generateCRUDDSL', () => {
    it('should generate CRUD DSL for a resource', () => {
      const dsl = generateCRUDDSL('User');

      expect(Array.isArray(dsl)).toBe(true);
      expect(dsl.length).toBe(5);
    });

    it('should generate GET collection route', () => {
      const dsl = generateCRUDDSL('User');
      const getCollection = dsl.find(r => r.path === '/api/users' && r.method === 'get');

      expect(getCollection).toBeDefined();
      expect(getCollection.response).toHaveProperty('type', 'array');
      expect(getCollection.response).toHaveProperty('minItems', 5);
      expect(getCollection.response).toHaveProperty('maxItems', 20);
    });

    it('should generate GET by ID route', () => {
      const dsl = generateCRUDDSL('User');
      const getById = dsl.find(r => r.path === '/api/users/:id' && r.method === 'get');

      expect(getById).toBeDefined();
      expect(getById.response).toHaveProperty('$ref', '#/definitions/User');
    });

    it('should generate POST route', () => {
      const dsl = generateCRUDDSL('User');
      const post = dsl.find(r => r.path === '/api/users' && r.method === 'post');

      expect(post).toBeDefined();
      expect(post).toHaveProperty('statusCode', 201);
      expect(post.response).toHaveProperty('type', 'object');
      expect(post.response.properties.success.type).toBe('boolean');
    });

    it('should generate PUT route', () => {
      const dsl = generateCRUDDSL('User');
      const put = dsl.find(r => r.path === '/api/users/:id' && r.method === 'put');

      expect(put).toBeDefined();
      expect(put.response).toHaveProperty('type', 'object');
      expect(put.response.properties.success.type).toBe('boolean');
      expect(put.response.properties.data.$ref).toBe('#/definitions/User');
    });

    it('should generate DELETE route', () => {
      const dsl = generateCRUDDSL('User');
      const del = dsl.find(r => r.path === '/api/users/:id' && r.method === 'delete');

      expect(del).toBeDefined();
      expect(del.response).toHaveProperty('type', 'object');
      expect(del.response.properties.success.type).toBe('boolean');
      expect(del.response.properties.message.type).toBe('string');
    });

    it('should use lowercase pluralization', () => {
      const dsl = generateCRUDDSL('Product');

      expect(dsl[0].path).toBe('/api/products');
      expect(dsl[1].path).toBe('/api/products/:id');
    });

    it('should handle single word resources', () => {
      const dsl = generateCRUDDSL('Item');

      expect(dsl[0].path).toBe('/api/items');
    });

    it('should handle multi-word resources', () => {
      const dsl = generateCRUDDSL('UserProfile');

      expect(dsl[0].path).toBe('/api/userprofiles');
    });
  });

  describe('Routes Generator - Edge Cases', () => {
    describe('request with empty body', () => {
      it('should handle POST request with empty body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];
        const mockReq = { body: {} };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response).toHaveProperty('data');
        expect(response.data).toHaveProperty('id');
      });

      it('should handle PUT request with empty body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const putRoute = routes['put:/api/users/:id'];
        const mockReq = {
          params: { id: '123' },
          body: {}
        };

        const response = putRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('id', '123');
      });
    });

    describe('request with malformed JSON', () => {
      it('should handle request with null body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];
        const mockReq = { body: null };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response).toHaveProperty('data');
      });

      it('should handle request with undefined body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];
        const mockReq = { body: undefined };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response).toHaveProperty('data');
      });

      it('should handle request with non-object body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];
        const mockReq = { body: 'string body' };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });

      it('should handle request with array body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];
        const mockReq = { body: [1, 2, 3] };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });
    });

    describe('request with oversized body', () => {
      it('should handle request with large object body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];

        // Create a large body
        const largeBody: any = {};
        for (let i = 0; i < 100; i++) {
          largeBody[`field${i}`] = `value${i}`.repeat(100);
        }
        const mockReq = { body: largeBody };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response).toHaveProperty('data');
      });

      it('should handle request with deep nested body', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];

        // Create a deeply nested body
        let nestedBody: any = { value: 'deep' };
        for (let i = 0; i < 20; i++) {
          nestedBody = { level: i, nested: nestedBody };
        }
        const mockReq = { body: nestedBody };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });
    });

    describe('request with special characters in URL', () => {
      it('should handle request with URL-encoded characters in params', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users/:id'];
        const mockReq = { params: { id: 'user%20with%20spaces' } };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('id', 'user%20with%20spaces');
      });

      it('should handle request with unicode characters in params', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users/:id'];
        const mockReq = { params: { id: '用户123' } };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('id', '用户123');
      });

      it('should handle request with special characters in params', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users/:id'];
        const mockReq = { params: { id: 'user@domain.com' } };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('id', 'user@domain.com');
      });
    });

    describe('request with query parameters', () => {
      it('should handle request with empty query', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = { query: {} };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response).toHaveProperty('data');
      });

      it('should handle request with single query param', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = { query: { page: '1' } };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });

      it('should handle request with multiple query params', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = {
          query: {
            page: '1',
            limit: '10',
            sort: 'name',
            filter: 'active'
          }
        };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });

      it('should handle request with special characters in query params', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = {
          query: {
            search: 'hello world',
            email: 'user@example.com'
          }
        };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });

      it('should handle request with unicode in query params', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = {
          query: {
            name: '用户名',
            city: '東京'
          }
        };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });
    });

    describe('request with headers', () => {
      it('should handle request with empty headers', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = { headers: {} };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });

      it('should handle request with standard headers', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = {
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer token123',
            'accept': 'application/json'
          }
        };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });

      it('should handle request with custom headers', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = {
          headers: {
            'x-custom-header': 'custom-value',
            'x-request-id': '12345',
            'x-api-version': 'v2'
          }
        };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });

      it('should handle request with special characters in headers', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const getRoute = routes['get:/api/users'];
        const mockReq = {
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'referer': 'https://example.com/page?param=value'
          }
        };

        const response = getRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
      });
    });

    describe('request with mixed edge cases', () => {
      it('should handle request with all edge cases combined', () => {
        const schema: Schema = {
          type: 'object',
          title: 'User'
        };

        const routes = generateRouteConfigs(schema);
        const postRoute = routes['post:/api/users'];

        const mockReq = {
          params: { id: 'user%20123' },
          query: {
            source: 'web',
            referrer: 'https://example.com'
          },
          headers: {
            'content-type': 'application/json',
            'x-custom': 'value'
          },
          body: {
            name: '用户',
            email: 'user@example.com',
            nested: { deep: { value: 'test' } }
          }
        };

        const response = postRoute.response(mockReq);

        expect(response).toHaveProperty('success', true);
        expect(response).toHaveProperty('data');
      });
    });

    describe('resource name edge cases', () => {
      it('should handle resource name with special characters', () => {
        const dsl = generateCRUDDSL('User-Profile');

        expect(dsl[0].path).toBe('/api/user-profiles');
      });

      it('should handle resource name with numbers', () => {
        const dsl = generateCRUDDSL('API2User');

        expect(dsl[0].path).toBe('/api/api2users');
      });

      it('should handle single character resource name', () => {
        const dsl = generateCRUDDSL('A');

        expect(dsl[0].path).toBe('/api/as');
      });

      it('should handle resource name with consecutive uppercase', () => {
        const dsl = generateCRUDDSL('XMLParser');

        expect(dsl[0].path).toBe('/api/xmlparsers');
      });
    });
  });
});
