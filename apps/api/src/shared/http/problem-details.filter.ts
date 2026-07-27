import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { type Response } from 'express';
import {
  ERROR_CODES,
  type ErrorCode,
  type FieldError,
  type ProblemDetails,
  problemType,
} from '@kelvin/contracts';

import { DomainError } from '../../core/errors/domain.error';

/**
 * Global exception filter — RFC 9457 (Problem Details).
 *
 * Uch turdagi xatoni bir formatga keltiradi:
 *   1. DomainError   → biznes qoidasi buzildi (4xx). `code` va `httpStatus` o'zida.
 *   2. HttpException → NestJS (guard, validatsiya, 404...). Status bo'yicha kod.
 *   3. Boshqasi      → kutilmagan (500). ICHKI DETAL HECH QACHON chiqmaydi —
 *                      faqat `traceId`. To'liq xato Pino logida.
 *
 * @see docs/04-api-spec.md §3
 * @see docs/02-architecture.md §9
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  constructor(private readonly cls: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const traceId = this.cls.getId();

    const problem = this.toProblem(exception, traceId);

    // 5xx — kutilmagan. To'liq detal LOGGA, javobga hech narsa.
    if (problem.status >= 500) {
      this.logger.error(
        { traceId, err: exception, code: problem.code },
        exception instanceof Error ? exception.message : 'Kutilmagan xato',
      );
    }

    res.status(problem.status).type('application/problem+json').json(problem);
  }

  private toProblem(exception: unknown, traceId: string): ProblemDetails {
    if (exception instanceof DomainError) {
      return this.build({
        status: exception.httpStatus,
        code: this.domainCodeToErrorCode(exception.code, exception.httpStatus),
        title: TITLES[exception.httpStatus] ?? 'Xatolik',
        detail: exception.message,
        traceId,
      });
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, traceId);
    }

    return this.build({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      title: 'Ichki xatolik',
      detail: "So'rovni bajarib bo'lmadi. Iltimos, keyinroq urinib ko'ring.",
      traceId,
    });
  }

  private fromHttpException(exception: HttpException, traceId: string): ProblemDetails {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // ValidationPipe → { message: string[], error, statusCode }.
    if (status === BAD_REQUEST_STATUS && this.isValidationResponse(response)) {
      const errors = this.extractFieldErrors(response.message);
      return this.build({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'VALIDATION_FAILED',
        title: "Ma'lumot noto'g'ri",
        detail: `So'rovda ${String(errors.length)} ta maydon xato to'ldirilgan.`,
        traceId,
        errors,
      });
    }

    // NestJS istisnolari `{ code }` bilan tashlangan bo'lishi mumkin.
    const explicitCode = this.extractExplicitCode(response);
    const code = explicitCode ?? STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';
    const detail = this.extractMessage(response) ?? exception.message;

    return this.build({
      status,
      code,
      title: TITLES[status] ?? 'Xatolik',
      detail,
      traceId,
    });
  }

  private build(input: {
    status: number;
    code: ErrorCode;
    title: string;
    detail: string;
    traceId: string;
    errors?: readonly FieldError[];
  }): ProblemDetails {
    return {
      type: problemType(input.code.toLowerCase().replace(/_/g, '-')),
      title: input.title,
      status: input.status,
      detail: input.detail,
      code: input.code,
      traceId: input.traceId,
      ...(input.errors !== undefined && input.errors.length > 0 && { errors: input.errors }),
    };
  }

  private domainCodeToErrorCode(code: string, status: number): ErrorCode {
    const mapped = DOMAIN_CODE_MAP[code];
    if (mapped !== undefined) {
      return mapped;
    }
    // BusinessRuleError kodi allaqachon valid ErrorCode bo'lishi mumkin
    // (INCOMPLETE_PRODUCT, INCOMPATIBLE_COMPONENTS, INVALID_STATE_TRANSITION...).
    if (ERROR_CODE_SET.has(code)) {
      return code as ErrorCode;
    }
    return STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR';
  }

  private isValidationResponse(
    response: string | object,
  ): response is { message: string[]; error: string } {
    return typeof response === 'object' && 'message' in response && Array.isArray(response.message);
  }

  private extractFieldErrors(messages: string[]): FieldError[] {
    // class-validator xabarlari — matn. Maydon nomi odatda birinchi so'z.
    return messages.map((message) => {
      const field = /^([a-zA-Z0-9_.]+)\s/.exec(message)?.[1] ?? 'body';
      return {
        pointer: `/${field.replace(/\./g, '/')}`,
        code: 'VALIDATION_FAILED',
        message,
      };
    });
  }

  private extractExplicitCode(response: string | object): ErrorCode | null {
    if (typeof response === 'object' && 'code' in response) {
      const code = response.code;
      if (typeof code === 'string' && ERROR_CODE_SET.has(code)) {
        return code as ErrorCode;
      }
    }
    return null;
  }

  private extractMessage(response: string | object): string | null {
    if (typeof response === 'string') {
      return response;
    }
    if ('message' in response) {
      const message = response.message;
      if (typeof message === 'string') {
        return message;
      }
    }
    return null;
  }
}

/** Enum'ni oddiy songa ajratamiz — status (number) bilan xavfsiz solishtirish. */
const BAD_REQUEST_STATUS: number = HttpStatus.BAD_REQUEST;

const TITLES: Readonly<Record<number, string>> = {
  400: "So'rov noto'g'ri",
  401: 'Autentifikatsiya talab qilinadi',
  403: 'Ruxsat yo‘q',
  404: 'Topilmadi',
  409: 'Holat ziddiyati',
  422: "Ma'lumot noto'g'ri",
  429: "So'rovlar juda ko'p",
  500: 'Ichki xatolik',
  502: 'Tashqi tizim xatosi',
  503: 'Vaqtincha ishlamayapti',
};

const STATUS_TO_CODE: Readonly<Record<number, ErrorCode>> = {
  400: 'MALFORMED_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'PERMISSION_DENIED',
  404: 'RESOURCE_NOT_FOUND',
  409: 'CONCURRENT_MODIFICATION',
  422: 'VALIDATION_FAILED',
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'INTERNAL_ERROR',
  502: 'PAYMENT_PROVIDER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/** core/errors DomainError kodlarini contracts ErrorCode ga bog'lash. */
const DOMAIN_CODE_MAP: Readonly<Record<string, ErrorCode>> = {
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  FORBIDDEN: 'PERMISSION_DENIED',
  CONFLICT: 'CONCURRENT_MODIFICATION',
  VALIDATION: 'VALIDATION_FAILED',
};

const ERROR_CODE_SET: ReadonlySet<string> = new Set(ERROR_CODES);
