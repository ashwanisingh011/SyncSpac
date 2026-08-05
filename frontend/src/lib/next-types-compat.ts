/**
 * Type-only compat shim for `import type { Metadata } from 'next'`.
 * Metadata exports are inert in the Vite SPA build.
 */
export interface Metadata {
  title?: string;
  description?: string;
  [key: string]: unknown;
}
