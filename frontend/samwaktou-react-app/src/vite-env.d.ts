/// <reference types="vite/client" />

/**
 * @file vite-env.d.ts
 * @description Vite client type declarations.
 *
 * Extends `import.meta.env` with the application-specific environment
 * variables so TypeScript recognises them without errors.
 */

interface ImportMetaEnv {
  readonly VITE_API_SERVER_URL: string;
  readonly VITE_APP_URL: string;
  readonly VITE_LOGIN_PATH: string;
  readonly VITE_ADMIN_PATH: string;
  readonly VITE_CREATE_AUDIO_PATH: string;
  readonly VITE_AUDIO_LINK_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
