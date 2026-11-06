// Vite aliases '@app-ssr' to src/entry-server.ts. The Vue app is type-checked by
// tsconfig.app.json (DOM types); the Worker only needs this signature.
declare module '@app-ssr' {
  export function render(url: string, initialData: Record<string, unknown>): Promise<string>
}
