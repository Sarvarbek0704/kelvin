import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { type AppConfig } from '../../config/configuration';
import { OutboxService } from './outbox.service';
import { OutboxRelayService } from './outbox-relay.service';
import { OUTBOX_QUEUE, OUTBOX_QUEUE_NAME } from './outbox.constants';

/**
 * Outbox — global (har modul `OutboxService.enqueue` ni ishlatadi).
 * BullMQ Queue shu yerda yaratiladi va graceful shutdown'da yopiladi.
 */
@Global()
@Module({
  providers: [
    {
      provide: OUTBOX_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): Queue => {
        const redis = config.get('redis', { infer: true });
        return new Queue(OUTBOX_QUEUE_NAME, {
          connection: {
            host: redis.host,
            port: redis.port,
            db: redis.db,
            ...(redis.password !== undefined && { password: redis.password }),
          },
        });
      },
    },
    OutboxService,
    OutboxRelayService,
  ],
  exports: [OutboxService, OutboxRelayService, OUTBOX_QUEUE],
})
export class OutboxModule implements OnModuleDestroy {
  constructor(@Inject(OUTBOX_QUEUE) private readonly queue: Queue) {}

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
