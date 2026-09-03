import { BadRequestException, Controller, Get, Module, QueryMethod } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createHttpApp } from '../src/index.js';

class TestController {
  hello(): { hello: string } {
    return { hello: 'world' };
  }

  fail(): never {
    throw new BadRequestException('Invalid input');
  }

  search(): { supported: boolean } {
    return { supported: true };
  }
}
Controller()(TestController);
applyGet(TestController, 'hello', '/hello');
applyGet(TestController, 'fail', '/fail');
applyRoute(QueryMethod('/search'), TestController, 'search');

class TestModule {}
Module({ controllers: [TestController] })(TestModule);

let app: NestFastifyApplication | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('createHttpApp', () => {
  it('serves Nest routes, health and OpenAPI without extra setup', async () => {
    app = await createHttpApp({
      rootModule: TestModule,
      preset: 'secure',
      health: true,
      openApi: { enabled: true, ui: true },
      observability: { logger: false },
    });
    await app.init();

    const hello = await app.inject({ method: 'GET', url: '/hello' });
    const health = await app.inject({ method: 'GET', url: '/health' });
    const spec = await app.inject({ method: 'GET', url: '/openapi.json' });
    const docs = await app.inject({ method: 'GET', url: '/docs/' });

    expect(hello.statusCode).toBe(200);
    expect(hello.json()).toEqual({ hello: 'world' });
    expect(health.json()).toEqual({ status: 'ok' });
    expect(spec.json().paths['/hello']).toBeDefined();
    expect(docs.statusCode).toBe(200);
    expect(docs.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('uses secure headers, bounded bodies and safe error responses', async () => {
    app = await createHttpApp({
      rootModule: TestModule,
      preset: 'secure',
      network: { bodyLimit: 16 },
      security: { cors: { origin: ['https://app.example.com'] } },
      observability: { logger: false },
    });
    await app.init();

    const response = await app.inject({ method: 'GET', url: '/fail', headers: { 'x-request-id': 'test-123' } });
    expect(response.statusCode).toBe(400);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.json()).toMatchObject({ message: 'Invalid input', requestId: 'test-123' });

    const preflight = await app.inject({
      method: 'OPTIONS',
      url: '/hello',
      headers: {
        origin: 'https://app.example.com',
        'access-control-request-method': 'PUT',
      },
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('https://app.example.com');
    expect(preflight.headers['access-control-allow-methods']).toContain('PUT');

    const queryPreflight = await app.inject({
      method: 'OPTIONS',
      url: '/search',
      headers: {
        origin: 'https://app.example.com',
        'access-control-request-method': 'QUERY',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(queryPreflight.statusCode).toBe(204);
    expect(queryPreflight.headers['access-control-allow-methods']).toContain('QUERY');

    const queryRequest = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: { q: 1 },
    });
    expect(queryRequest.statusCode).toBe(200);
    expect(queryRequest.json()).toEqual({ supported: true });
  });
});

function applyGet(target: object, method: 'hello' | 'fail', path: string): void {
  applyRoute(Get(path), target, method);
}

function applyRoute(
  decorator: MethodDecorator,
  target: object,
  method: 'hello' | 'fail' | 'search',
): void {
  const descriptor = Object.getOwnPropertyDescriptor(target.prototype, method);
  if (!descriptor) throw new Error(`Missing ${method} descriptor`);
  decorator(target.prototype, method, descriptor);
}
