/// <reference types="vite/client" />

import { Server as HttpServer } from 'http';
import { IncomingMessage, ServerResponse } from 'http';

declare module 'vite' {
  interface ServerOptions {
    middlewareMode?: boolean | 'html' | 'ssr';
    hmr?: boolean | {
      server?: HttpServer<typeof IncomingMessage, typeof ServerResponse>;
      [key: string]: any;
    };
    fs?: {
      strict?: boolean;
      allow?: string[];
      deny?: string[];
    };
    watch?: {
      usePolling?: boolean;
      interval?: number;
    };
    cors?: boolean | any;
    origin?: string;
    host?: string | boolean;
    port?: number;
    strictPort?: boolean;
    proxy?: Record<string, any>;
    base?: string;
    https?: boolean | any;
    open?: boolean | string;
    allowedHosts?: boolean | string | RegExp | Array<string | RegExp>;
    headers?: Record<string, string>;
  }
}