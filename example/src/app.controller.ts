import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('application')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Show example API information' })
  info(): Record<string, unknown> {
    return {
      name: '@authuser/nest example',
      status: 'running',
      endpoints: {
        users: '/api/users',
        health: '/health',
        readiness: '/ready',
        openapi: '/openapi.json',
        swagger: '/docs',
      },
    };
  }
}
