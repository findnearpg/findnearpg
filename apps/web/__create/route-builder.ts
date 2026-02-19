import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

const routeModules = import.meta.glob('../src/app/api/**/route.js');

function getHonoPath(modulePath: string): string {
  const relativePath = modulePath.replace('../src/app/api/', '').replace(/\\/g, '/');
  const routeParts = relativePath.split('/').filter(Boolean).slice(0, -1); // remove route.js

  if (routeParts.length === 0) {
    return '/';
  }

  const transformed = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (!match) return segment;
    const dots = match[1];
    const param = match[2];
    return dots === '...' ? `:${param}{.+}` : `:${param}`;
  });

  return `/${transformed.join('/')}`;
}

function registerRoutes() {
  api.routes = [];

  const routeFiles = Object.keys(routeModules).sort((a, b) => b.length - a.length);
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

  for (const modulePath of routeFiles) {
    try {
      const honoPath = getHonoPath(modulePath);
      const loadModule = routeModules[modulePath];

      for (const method of methods) {
        const handler: Handler = async (c) => {
          const params = c.req.param();
          const loaded = await loadModule();
          const action = loaded[method];
          if (!action) {
            return c.notFound();
          }
          return await action(c.req.raw, { params });
        };

        switch (method) {
          case 'GET':
            api.get(honoPath, handler);
            break;
          case 'POST':
            api.post(honoPath, handler);
            break;
          case 'PUT':
            api.put(honoPath, handler);
            break;
          case 'DELETE':
            api.delete(honoPath, handler);
            break;
          case 'PATCH':
            api.patch(honoPath, handler);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error(`Error registering route module ${modulePath}:`, error);
    }
  }
}

registerRoutes();

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    try {
      registerRoutes();
    } catch (error) {
      console.error('Error hot reloading API routes:', error);
    }
  });
}

export { api, API_BASENAME };
