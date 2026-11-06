/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional POST endpoint for the contact form (e.g. Formspree). Falls back to mailto:. */
  readonly VITE_CONTACT_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
