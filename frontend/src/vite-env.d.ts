/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE?: string
  readonly VITE_API_PROXY_TARGET?: string
  readonly VITE_CACHE_DIR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
