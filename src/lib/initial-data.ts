import type { InjectionKey } from 'vue'

/**
 * API responses the Worker already loaded for this page, keyed by API path. The
 * server renders with them and inlines the same object into the HTML, so the
 * browser hydrates with identical data and makes no extra request.
 */
export type InitialData = Record<string, unknown>

export const INITIAL_DATA: InjectionKey<InitialData> = Symbol('initial-data')

/** Stands in for an API error response (e.g. an article that does not exist). */
export interface InitialError {
  __apiError: { status: number; message: string }
}

export const isInitialError = (v: unknown): v is InitialError =>
  typeof v === 'object' && v !== null && '__apiError' in v
