/** Transactional outbox — umumiy konstantalar. */
export const OUTBOX_QUEUE_NAME = 'outbox';

/** BullMQ Queue injection tokeni. */
export const OUTBOX_QUEUE = Symbol('OUTBOX_QUEUE');

/**
 * PROCESSING holatidagi event qancha "ko'rinmas" bo'ladi (sekund). Worker
 * yiqilsa, shu muddatdan keyin event qayta olinadi (at-least-once).
 */
export const OUTBOX_VISIBILITY_SECONDS = 30;

/** Muvaffaqiyatsiz urinishdan keyingi orqaga chekinish (sekund). */
export const OUTBOX_BACKOFF_SECONDS = 10;

/** Bir eventni necha marta urinib ko'rish — undan keyin FAILED. */
export const OUTBOX_MAX_ATTEMPTS = 10;
