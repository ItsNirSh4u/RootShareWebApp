import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiUnauthorizedResponse = (): MethodDecorator & ClassDecorator =>
  ApiResponse({ status: 401, description: 'Unauthorized.' });

export const ApiForbiddenResponse = (): MethodDecorator & ClassDecorator =>
  ApiResponse({ status: 403, description: 'Forbidden.' });

export const ApiNotFoundResponse = (resource: string = 'Resource'): MethodDecorator & ClassDecorator =>
  ApiResponse({ status: 404, description: `${resource} not found.` });

export const ApiOwnershipResponses = (resource: string = 'Resource'): MethodDecorator & ClassDecorator =>
  applyDecorators(
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
    ApiNotFoundResponse(resource),
  );

export const ApiProtectedReadResponses = (resource: string = 'Resource'): MethodDecorator & ClassDecorator =>
  applyDecorators(
    ApiUnauthorizedResponse(),
    ApiNotFoundResponse(resource),
  );
