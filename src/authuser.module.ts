import { Global, Module, type DynamicModule, type Provider } from '@nestjs/common';
import type { ConfigureHttpAppOptions } from './types.js';

export const AUTHUSER_OPTIONS = Symbol.for('@authuser/nest/options');

export interface AuthuserModuleAsyncOptions {
  inject?: Array<string | symbol | Function>;
  useFactory: (...dependencies: never[]) => ConfigureHttpAppOptions | Promise<ConfigureHttpAppOptions>;
}

@Global()
@Module({})
export class AuthuserModule {
  static forRoot(options: ConfigureHttpAppOptions = {}): DynamicModule {
    return {
      module: AuthuserModule,
      providers: [{ provide: AUTHUSER_OPTIONS, useValue: Object.freeze({ ...options }) }],
      exports: [AUTHUSER_OPTIONS],
    };
  }

  static forRootAsync(options: AuthuserModuleAsyncOptions): DynamicModule {
    const provider: Provider = {
      provide: AUTHUSER_OPTIONS,
      inject: options.inject ?? [],
      useFactory: options.useFactory,
    };
    return { module: AuthuserModule, providers: [provider], exports: [provider] };
  }
}
