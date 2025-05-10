// Type definitions to override vite server options

declare module 'vite' {
  interface ServerOptions {
    middlewareMode?: boolean | 'html' | 'ssr';
    hmr?: boolean | {
      server?: any;
      [key: string]: any;
    };
    allowedHosts?: boolean | string | RegExp | Array<string | RegExp>;
    [key: string]: any;
  }
}

// Fix for Drizzle-orm Json type
declare module 'drizzle-orm/pg-core' {
  interface JsonTypeConfig<TData> {
    data: TData;
  }
}