import { Server } from "bun";
import QS from 'fast-querystring';
import { BunziResponseStatuses, BunzEngineRoutes, BunzEngineRoute, BunziParams, BunzRequest } from '../types';
import { BunziResponse } from './BunziResponse';
import { readdir } from "fs/promises";
import Handlebars from "handlebars";
import { BunziiError } from "./BunziiError";

type BunziiTemplateEngine = {
    name: string,
    allowedPartiars: string[]
}

class TrieNode {
    children: Map<string, TrieNode> = new Map();
    handler: { method: string, handler: Function } | null = null;
}

export default class Bunzii {
    public static statuses: BunziResponseStatuses = {};
    private server: Server | undefined;
    private root: TrieNode = new TrieNode();
    private headers: Headers = new Headers();
    private engine: BunziiTemplateEngine = { name: 'static-html', allowedPartiars: [] };

    constructor() {
        // * Set default headers for Bunzi
        this.headers.set('X-Powered-By', 'Bunzi')
        this.headers.set('Server', 'BunziServe')
        this.headers.set('Content-Type', 'text/html')
    }

    public setEngine = (name: string) => {
        this.engine.name = name;
        if (name === "handlebars") {
            readdir('./pages').then((files) => {
                files.forEach(async (file) => {
                    if (file.match(/(.+)\@partial\.handlebars/g)) {
                        Handlebars.registerPartial(file.replace('@partial.handlebars', ''), await Bun.file(`./pages/${file}`).text() || '')
                    }
                })
            })
        }
        return this;
    };
    private addToTrie(path: string, method: string, handler: Function) {
        let node = this.root;
        const pathSegments = path.split('/').filter(Boolean);

        for (const segment of pathSegments) {
            if (!node.children.has(segment)) {
                node.children.set(segment, new TrieNode());
            }
            node = node.children.get(segment)!;
        }
        node.handler = { method, handler };
    }




    private findRoute(path: string): BunzEngineRoute | null {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        let node = this.root;
        const pathSegments = path.split('/').filter(Boolean);
        const params: BunziParams = {};

        for (const segment of pathSegments) {
            let value = node.children.keys().next().value;
            let seg = value?.startsWith(':') ? value : segment;
            if (value?.startsWith(':')) params[value.slice(1)] = segment;

            if (!node || !node.children.has(seg)) {
                return null;
            } else {
                node = node.children.get(seg)!;
            }
        }

        if (node?.handler) {
            return {
                method: node.handler.method,
                path: path,
                handler: node.handler.handler,
                params: Object.keys(params).length > 0 ? params : {},
            };
        }

        return null;
    }


    public route(method: string, path: string, handler: Function) {
        this.addToTrie(path, method, handler);
        console.log(`💥 ${method} ${path}`);
        return this;
    }

    public get(path: string, handler: Function) {
        return this.route('GET', path, handler);
    }

    public post(path: string, handler: Function) {
        return this.route('POST', path, handler);
    }

    public put(path: string, handler: Function) {
        return this.route('PUT', path, handler);
    }

    public patch(path: string, handler: Function) {
        return this.route('PATCH', path, handler);
    }

    public delete(path: string, handler: Function) {
        return this.route('DELETE', path, handler);
    }

    private async handleRequest(request: BunzRequest): Promise<Response | undefined> {
        let requestURL = new URL(request.url);
        let requestPath = requestURL.pathname;
        let route = this.findRoute(requestPath);
        if (!route) return BunziiError.throw('Page not found', null, 404);
        if (route && route.method === request.method) {
            request.params = route.params;
            request.query = QS.parse(request.url.split('?')[1] || '');
            let response = route.handler(request, new BunziResponse({ headers: this.headers, template_engine: this.engine }));
            return response;
        }
    }

    public listen(port: number) {
        this.server = Bun.serve({
            port,
            fetch: async (request: BunzRequest) => {
                const rsp = await this.handleRequest(request);
                if (rsp) return rsp;
                return new Response('Router error', { status: 502 });
            }
        })
    }
}
