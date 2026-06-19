import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ApiErrorDto,
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from '../dtos/api-response.dto';

type ApiWrappedResponseOptions = {
  status?: 200 | 201;
  description?: string;
  isArray?: boolean;
};

export function ApiWrappedResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: ApiWrappedResponseOptions = {},
) {
  const {
    status = 200,
    description = 'Successful response.',
    isArray = false,
  } = options;

  const responseSchema = {
    allOf: [
      {
        $ref: getSchemaPath(ApiSuccessResponseDto),
      },
      {
        properties: {
          data: isArray
            ? {
                type: 'array',
                items: {
                  $ref: getSchemaPath(model),
                },
              }
            : {
                $ref: getSchemaPath(model),
              },
        },
      },
    ],
  };

  const successDecorator =
    status === 201
      ? ApiCreatedResponse({
          description,
          schema: responseSchema,
        })
      : ApiOkResponse({
          description,
          schema: responseSchema,
        });

  return applyDecorators(
    ApiExtraModels(ApiSuccessResponseDto, model),
    successDecorator,
  );
}

export function ApiWrappedErrorResponses() {
  return applyDecorators(
    ApiExtraModels(ApiErrorDto, ApiErrorResponseDto),

    ApiBadRequestResponse({
      description: 'Bad request.',
      schema: {
        $ref: getSchemaPath(ApiErrorResponseDto),
      },
    }),

    ApiNotFoundResponse({
      description: 'Resource not found.',
      schema: {
        $ref: getSchemaPath(ApiErrorResponseDto),
      },
    }),

    ApiInternalServerErrorResponse({
      description: 'Internal server error.',
      schema: {
        $ref: getSchemaPath(ApiErrorResponseDto),
      },
    }),
  );
}
