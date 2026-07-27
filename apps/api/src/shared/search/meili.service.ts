import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Index, MeiliSearch, type SearchParams, type SearchResponse } from 'meilisearch';

import { type AppConfig } from '../../config/configuration';
import { PRODUCTS_INDEX, PRODUCTS_SETTINGS } from './index-settings';

/**
 * Meilisearch klienti. Faqat qidiruv INDEKSI — haqiqat manbai PostgreSQL.
 * Index yo'qolsa PostgreSQL'dan qayta quriladi. docs/05 §3.2, §3.3
 */
@Injectable()
export class MeiliService implements OnModuleInit {
  private readonly logger = new Logger(MeiliService.name);
  private readonly client: MeiliSearch;

  constructor(config: ConfigService<AppConfig, true>) {
    const search = config.get('search', { infer: true });
    this.client = new MeiliSearch({
      host: search.host,
      ...(search.apiKey !== undefined && { apiKey: search.apiKey }),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureIndex();
    } catch (err) {
      // Meilisearch yiqilgan bo'lsa ilova baribir ishlaydi (fallback — §3.4).
      this.logger.warn(
        `Meilisearch indeksini tayyorlab bo'lmadi: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private index(): Index {
    return this.client.index(PRODUCTS_INDEX);
  }

  /** Indeks + sozlamalarni ta'minlaydi (idempotent). */
  async ensureIndex(): Promise<void> {
    await this.client.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' }).catch(() => undefined);
    await this.index().updateSettings(PRODUCTS_SETTINGS);
    this.logger.log('Meilisearch products indeksi tayyor');
  }

  /** Upsert (addDocuments — mavjud id ustiga yozadi, at-least-once xavfsiz). */
  async upsert(documents: Record<string, unknown>[]): Promise<void> {
    if (documents.length > 0) {
      await this.index().addDocuments(documents, { primaryKey: 'id' });
    }
  }

  async remove(id: string): Promise<void> {
    await this.index().deleteDocument(id);
  }

  async clear(): Promise<void> {
    await this.index().deleteAllDocuments();
  }

  search(query: string, params: SearchParams): Promise<SearchResponse<Record<string, unknown>>> {
    return this.index().search(query, params);
  }

  /** Testlar uchun — indekslashni sinxron kutish. */
  async waitForTasks(): Promise<void> {
    const tasks = await this.client.tasks.getTasks({ statuses: ['enqueued', 'processing'] });
    await Promise.all(tasks.results.map((t) => this.client.tasks.waitForTask(t.uid)));
  }
}
