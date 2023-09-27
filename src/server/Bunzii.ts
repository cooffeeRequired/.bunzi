import { Server } from "bun"
const QS = require('fast-querystring')
import { BunziResponseStatuses, BunzEngineRoutes, BunzEngineRoute, BunziParams, BunzRequest } from '../types'
import { BunziResponse } from './BunziResponse'
import { readdir } from "fs/promises";
import Handlebars from "handlebars";

type BunziiTemplateEngine = {
    name: string,
    allowedPartiars: string[]
}

class Bunzii {
    public static statuses: BunziResponseStatuses = {};
    private server: Server | undefined
    private routes: BunzEngineRoutes = {}
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
        return this
    };


    public route(method: string, path: string, handler: Function) {
        this.routes[path] = { method, path, handler, params: {} }
        console.log(`💥 ${method} ${path}`)
        return this;
    }
    public get = (path: string, handler: Function) => this.route('GET', path, handler);
    public post = (path: string, handler: Function) => this.route('POST', path, handler);
    public put = (path: string, handler: Function) => this.route('PUT', path, handler);
    public patch = (path: string, handler: Function) => this.route('PATCH', path, handler);
    public delete = (path: string, handler: Function) => this.route('DELETE', path, handler);

    private routeCache: Record<string, BunzEngineRoute | null> = {};
    private findRoute(path: string): BunzEngineRoute | null {
        // Ujistěte se, že cesta začíná znakem '/'
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        let route = this.routes[path];

        if (route) {
            this.routeCache[path] = route;
            return route;
        }

        let routes = Object.keys(this.routes);
        let spPath = path.split("/").filter(Boolean);
        let spRoutes = routes.map(r => r.split("/").filter(Boolean));
        spRoutes = spRoutes.filter(r => r.length === spPath.length);
        let foundRoutePath = spRoutes.find(r => r.every((rp, i) => rp.startsWith(":") || rp === spPath[i]));

        if (foundRoutePath) {
            let foundRoute: BunzEngineRoute = this.routes[`/${foundRoutePath.join("/")}`];

            if (foundRoute) {
                let params: BunziParams = {};

                foundRoutePath.forEach((rp, i) => {
                    if (rp.startsWith(":")) {
                        params[rp.slice(1)] = spPath[i];
                    }
                });

                // Kontrola existence foundRoute před přístupem k params
                if (foundRoute) {
                    foundRoute.params = params;
                }
                this.routeCache[path] = foundRoute;
                return foundRoute;
            }
        }

        return null;
    }
    public listen(port: number) {
        this.server = Bun.serve({
            port,
            fetch: async (request: BunzRequest) => {
                const requestURL = new URL(request.url);
                const requestPath = requestURL.pathname;
                const route = this.routes[requestPath] || await this.findRoute(requestPath);

                if (!route) return new Response('Not Found', { status: 404, headers: this.headers });

                if (route && route.method === request.method) {
                    request = request;
                    request.params = route.params;
                    request.query = QS.parse(request.url.split('?')[1])
                    const response = route.handler(request, new BunziResponse({ headers: this.headers, template_engine: this.engine }));
                    return response;
                }
            },
        });
        console.log('💡 Bunzii listening on port ' + port)
    }
}
export default new Bunzii();
