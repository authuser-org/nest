import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import type { ResolvedOptions } from './options.js';

export async function registerOpenApi(
  app: NestFastifyApplication,
  fastify: FastifyInstance,
  options: ResolvedOptions['openApi'],
): Promise<void> {
  if (!options.enabled) return;

  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  let builder = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version);
  if (options.bearerAuth) builder = builder.addBearerAuth();

  const document = SwaggerModule.createDocument(app, builder.build());

  if (options.json) {
    fastify.get(options.jsonPath, {
      ...(options.preHandler ? { preHandler: options.preHandler } : {}),
    }, async (_request, reply) => reply.send(document));
  }

  if (options.ui) {
    const { default: swagger } = await import('@fastify/swagger');
    const { default: swaggerUi } = await import('@fastify/swagger-ui');
    await fastify.register(swagger, {
      mode: 'static',
      // Nest and Fastify publish structurally compatible but distinct OpenAPI types.
      specification: { document: document as never },
    });
    await fastify.register(swaggerUi, {
      routePrefix: options.uiPath,
      uiConfig: { docExpansion: 'list', deepLinking: true, spec: document },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      ...(options.preHandler ? { uiHooks: { preHandler: options.preHandler } } : {}),
    });
  }
}
