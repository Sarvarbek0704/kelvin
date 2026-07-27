import { ForbiddenException, type ArgumentsHost, BadRequestException } from '@nestjs/common';
import { type ClsService } from 'nestjs-cls';
import { type ProblemDetails } from '@kelvin/contracts';

import { ProblemDetailsFilter } from './problem-details.filter';
import { NotFoundError } from '../../core/errors/domain.error';

interface Captured {
  status: number;
  body: ProblemDetails;
  contentType: string;
}

function runFilter(exception: unknown): Captured {
  const captured: Partial<Captured> = {};
  const res = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    type(t: string) {
      captured.contentType = t;
      return this;
    },
    json(body: ProblemDetails) {
      captured.body = body;
      return this;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => ({}) }),
  } as unknown as ArgumentsHost;

  const cls = { getId: () => 'trace-123' } as unknown as ClsService;
  const filter = new ProblemDetailsFilter(cls);
  filter.catch(exception, host);
  return captured as Captured;
}

describe('ProblemDetailsFilter (RFC 9457)', () => {
  it('DomainError → status + kod + traceId', () => {
    const out = runFilter(new NotFoundError('Buyurtma', 'x1'));
    expect(out.status).toBe(404);
    expect(out.contentType).toBe('application/problem+json');
    expect(out.body.code).toBe('RESOURCE_NOT_FOUND');
    expect(out.body.status).toBe(404);
    expect(out.body.traceId).toBe('trace-123');
  });

  it('HttpException {code} → o‘sha kod ishlatiladi', () => {
    const out = runFilter(new ForbiddenException({ code: 'PERMISSION_DENIED' }));
    expect(out.status).toBe(403);
    expect(out.body.code).toBe('PERMISSION_DENIED');
  });

  it('validatsiya (BadRequest message[]) → 422 + errors[]', () => {
    const out = runFilter(
      new BadRequestException({
        message: ['identifier must be longer', 'password must be a string'],
        error: 'Bad Request',
        statusCode: 400,
      }),
    );
    expect(out.status).toBe(422);
    expect(out.body.code).toBe('VALIDATION_FAILED');
    expect(out.body.errors).toHaveLength(2);
    expect(out.body.errors?.[0]?.pointer).toBe('/identifier');
  });

  it('kutilmagan xato → 500, ICHKI DETAL yo‘q', () => {
    const out = runFilter(new Error('DB connection string leaked: postgres://secret'));
    expect(out.status).toBe(500);
    expect(out.body.code).toBe('INTERNAL_ERROR');
    // Ichki detal sizmasligi kerak.
    expect(JSON.stringify(out.body)).not.toContain('secret');
    expect(out.body.traceId).toBe('trace-123');
  });
});
