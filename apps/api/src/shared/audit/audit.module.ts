import { Global, Module } from '@nestjs/common';

import { AuditService } from './audit.service';

/**
 * Audit — global, chunki har modul yozadi (cross-cutting).
 * docs/15-roadmap.md §2.1
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
