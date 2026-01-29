import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiUnauthorizedResponse = () =>
  ApiResponse({ status: 401, description: 'Unauthorized.' });

export const ApiForbiddenResponse = () =>
  ApiResponse({ status: 403, description: 'Forbidden.' });

export const ApiNotFoundResponse = (resource: string = 'Resource') =>
  ApiResponse({ status: 404, description: `${resource} not found.` });

export const ApiOwnershipResponses = (resource: string = 'Resource') =>
  applyDecorators(
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
    ApiNotFoundResponse(resource),
  );

export const ApiProtectedReadResponses = (resource: string = 'Resource') =>
  applyDecorators(
    ApiUnauthorizedResponse(),
    ApiNotFoundResponse(resource),
  );
