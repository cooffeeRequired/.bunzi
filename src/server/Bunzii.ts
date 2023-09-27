import { Server } from "bun";
import QS from 'fast-querystring';
import { BunziResponseStatuses, BunzEngineRoute, BunziParams, BunzRequest, BunziiTemplateEngine } from '../types';
import { BunziResponse } from './BunziResponse';
import { readdir } from "fs/promises";
import Handlebars from "handlebars";
import { BunziiError } from "./BunziiError";

class TrieNode {
    children: Map<string, TrieNode> = new Map();
    handler: { method: string, handler: Function } | null = null;
}

export default class Bunzii {
    public static statuses: BunziResponseStatuses = {};
    private server: Server | undefined;
    private root: TrieNode = new TrieNode();
    private headers: Headers = new Headers();
    private engine: BunziiTemplateEngine = {
        name: 'static-html',
        allowedPartiars: [],
        layout: '',
        opt: {
            title: '',
            description: '',
            keywords: '',
            staticDir: '',
            ext: ''
        }
    };

    constructor() {
        // * Set default headers for Bunzi
        this.headers.set('X-Powered-By', 'Bunzi')
        this.headers.set('Server', 'BunziServe')
        this.headers.set('Content-Type', 'text/html')
    }

    public staticDir = (path: string) => {
        this.engine.opt.staticDir = path;
        return this;
    };

    public setTitle = (title: string) => {
        this.engine.opt.title = title;
        return this;
    };

    public setEngine = (name: string, opt: any) => {
        this.engine.opt = { ...this.engine.opt, ...opt };
        this.engine.name = name;
        if (name === "handlebars") {
            Handlebars.registerHelper('json', function (context) {
                return JSON.stringify(context);
            });
            let ext = opt.ext ? opt.ext : '.handlebars';
            readdir('./pages').then((files) => {
                if (!files.includes(`layout${ext}`)) return BunziiError.throw('Layout not found', null, 502);
                for (let file of files) {
                    if (file === `layout${ext}`) {
                        this.engine.layout = file;
                    } else {
                        if (file === 'partials') {
                            readdir('./pages/partials').then((files) => {
                                files.forEach(async (file) => {
                                    Handlebars.registerPartial(`${file.replaceAll(ext, '')}`, await Bun.file(`./pages/partials/${file}`).text() || '')
                                })
                            })
                        } else {
                            continue;
                        }
                    }
                }
            })
        }
        return this;
    };
    private addToTrie(path: string, method: string, handler: Function) {
        console.time('addToTrie')
        let node = this.root;
        const pathSegments = path.split('/').filter(Boolean);

        for (const segment of pathSegments) {
            if (!node.children.has(segment)) {
                node.children.set(segment, new TrieNode());
            }
            node = node.children.get(segment)!;
        }
        node.handler = { method, handler };
        console.timeEnd('addToTrie')
    }

    //! Find route in trie goes take 3.5ms per request,
    //! Th[G] = 11.03MB/s, Th[M] = 0.00MB/s, Th[C] = 0.00MB/s, Th[T] = 11.03MB/s
    //! 0.03ms per route... (adding)

    //? 0.50ms per route while parsing JSON
    //? 0.7 - 0.23ms per route while using a paths params and query
    //? 0.4 - 0.23ms per route while clear path or path without params and query
    //? 0.3 - 0.16ms per route while using 404/500/502 error

    //* Th[G-1] shall be less than 0.3ms
    //* Th[M-1] shall be less than 0.3ms
    //* Th[C-1] shall be less than 0.5ms
    //* Th[T-1] T may be request time, so it's not important
    //! rewrite this function for using a Regex (Patterns) white inner fns



    private findRoute(path: string): BunzEngineRoute | null {
        console.time('findRoute')
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
                console.timeEnd('findRoute')
                return null;
            } else {
                node = node.children.get(seg)!;
            }
        }

        console.timeEnd('findRoute')

        if (node?.handler) {
            return {
                method: node.handler.method,
                path: path,
                handler: node.handler.handler,
                params: Object.keys(params).length > 0 ? params : {},
            };
        }

        console.timeEnd('findRoute')

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

    private async handleStatic(request: BunzRequest): Promise<Response | undefined> {
        if (this.engine.opt.staticDir) {
            let requestURL = new URL(request.url);
            let requestPath = requestURL.pathname;
            let path = `${this.engine.opt.staticDir}${requestPath}`
            if (path) {
                let file = Bun.file(path);
                if (await file.exists()) {
                    return new Response(await file.arrayBuffer(), { headers: { 'Content-Type': `${file.type}` } })
                }
            }
        }
    }

    public listen(port: number) {
        this.server = Bun.serve({
            port,
            fetch: async (request: BunzRequest) => {
                let rsp;
                rsp = await this.handleStatic(request);
                if (rsp) return rsp;
                rsp = await this.handleRequest(request);
                if (rsp) return rsp;
                return new Response('Router error', { status: 502 });
            }
        })
    }
}
