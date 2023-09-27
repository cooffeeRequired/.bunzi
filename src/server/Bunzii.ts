const Router = require('@medley/router');
import URLWrapper from '../utils/URLWrapper.ts';
import { BunziiError } from './BunziiError';
import { BunziiResponse } from './BunziiResponse';
import { Server } from 'bun'
import { BunziiConfig, BunziiFunction, BunziiHeaders, BunziiRequest } from '../types/core';



export default class Bunzii {
    private readonly router;
    private headers: BunziiHeaders = new Map();
    private configuration: BunziiConfig = {
        plugins: {},
        static: {
            dir: '',
            allowed: false
        }
    } as BunziiConfig;


    constructor() {
        // * Set default headers for Bunzi
        this.headers.set('X-Powered-By', 'Bunzi')
        this.headers.set('Server', 'BunziServe')
        this.headers.set('Content-Type', 'text/html')
        this.router = new Router();
    }

    public get = (path: string, handler: BunziiFunction): Bunzii => this.route('GET', path, handler);
    public post = (path: string, handler: BunziiFunction): Bunzii => this.route('POST', path, handler);
    public patch = (path: string, handler: BunziiFunction): Bunzii => this.route('PATCH', path, handler);
    public put = (path: string, handler: BunziiFunction): Bunzii => this.route('PUT', path, handler);
    public delete = (path: string, handler: BunziiFunction): Bunzii => this.route('DELETE', path, handler);
    public route = (method: string, path: string, handler: BunziiFunction): Bunzii => {
        const store = this.router.register(path)
        store[method] = handler;
        console.log('➕ Added route', method, path)
        return this;
    }

    private handleRequest = async (req: BunziiRequest): Promise<Response | undefined> => {
        let wrappedURL = req.parsedURL;
        let path = wrappedURL.getPath();
        const find = this.router.find(path);
        if (find && find.store[req.method]) {
            req.params = find.params;
            req.query = wrappedURL.getParam();
            let response = find.store[req.method](req, new BunziiResponse({ headers: this.headers }));
            return response;
        } else {
            return BunziiError.throw('Page not found', null, 404);
        }
    }

    private handleStatic = async (url: URLWrapper): Promise<Response | undefined> => {
        if (!this.configuration.static.allowed) return BunziiError.throw('Static not allowed', null, 405);
        const oreginalPath = url.getPath();

        if (oreginalPath) {
            const path = `${this.configuration.static.dir}${oreginalPath}`;
            if (!path) return BunziiError.throw('Source not foud', null, 405);
            const file = Bun.file(path);
            if (await file.exists()) {
                return new Response(file, { headers: Object.fromEntries(this.headers) })
            }
        }
    }

    public listen = async (port: number) => {
        this.configuration.server = Bun.serve({
            port,
            fetch: async (request: Request) => {
                const req = request as BunziiRequest;
                req.parsedURL = new URLWrapper(request.url);
                if (this.configuration.static.allowed) {
                    let response = await this.handleStatic(req.parsedURL);
                    if (response) return response;
                }
                let response = await this.handleRequest(req);
                if (response) return response;
                return new Response('Router error', { status: 502 })
            }
        })
        console.log('🚀 Bunzi is listening on port', port)
    }
}
