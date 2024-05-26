/// <reference types="vite/client" />

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
  