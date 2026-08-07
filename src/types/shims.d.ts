declare const process: {
  env: Record<string, string | undefined>
}

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly [key: string]: string | boolean | number | undefined
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

declare module '@tanstack/react-start' {
  export interface MiddlewareRequestContext {
    next: (input?: { context?: unknown; headers?: Record<string, string> }) => Promise<unknown>
  }

  export interface MiddlewareBuilder {
    server(handler: (ctx: MiddlewareRequestContext) => Promise<unknown>): unknown
    client(handler: (ctx: MiddlewareRequestContext) => Promise<unknown>): unknown
  }

  export function createMiddleware(options?: { type?: string }): MiddlewareBuilder
}

declare module '@tanstack/react-start/server' {
  export function getRequest(): { headers: Headers } | undefined
}

declare module '@supabase/supabase-js' {
  export function createClient<T = unknown>(
    url: string,
    key: string,
    options?: unknown,
  ): {
    auth: {
      getUser(token?: string): Promise<{
        data?: { user?: { id: string } | null }
        error?: { message?: string } | null
      }>
      getClaims(token: string): Promise<{
        data?: { claims?: { sub?: string } }
        error?: unknown
      }>
      signOut(): Promise<{ error?: unknown }>
    }
  }
}
