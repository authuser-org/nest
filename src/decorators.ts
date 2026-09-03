import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'authuser:isPublic';
export const ROLES_KEY = 'authuser:roles';

/** Marks a handler or controller as public for application-defined guards. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/** Attaches required roles for application-defined guards. */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
