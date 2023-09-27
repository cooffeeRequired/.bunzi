import { file, Server } from "bun";
import Handlebars from "handlebars";
import { BunziiError } from './BunziiError'
import { BunziRenderOptions, BunziiTemplateEngine } from "../types";

export class BunziResponse {
    private statusCode: number = 404;
    private headers: Headers;
    private engine: string;
    private opt: any = {}

    constructor(options: { headers: Headers, template_engine: BunziiTemplateEngine }) {
        this.headers = options.headers;
        this.engine = options.template_engine.name;
        this.opt = options.template_engine.opt;
    }

    public send(str: any): Response {
        return new Response(str, { status: this.statusCode, headers: this.headers })
    }

    public json(obj: any): Response | Error {
        try {
            this.headers.set('Content-Type', 'application/json');
            this.headers.set('Content-Type-X', 'application/json+bunzi')
            return Response.json(obj, { status: this.statusCode, headers: this.headers })
        } catch (e: any) {
            return new Error(e.toString())
        }
    }

    public sendFile(path: string): Response | Error {
        try {
            return new Response(file(path), { status: this.statusCode, headers: this.headers })
        } catch (e: any) {
            return new Error(e.toString())
        }
    }

    public async render(data: any, input: any, opt: BunziRenderOptions): Promise<Response | Error> {
        try {
            const ext = this.opt.ext ? this.opt.ext : '.handlebars';
            switch (this.engine.toLocaleLowerCase()) {
                case "static-html": return new Response(data);
                case "handlebars": {
                    if ((opt && opt.title.startsWith(':')) || !opt) {
                        opt = { ...opt, title: `${this.opt.title} ${data.replace('@', '')}` }
                    }
                    let html;
                    if (data.startsWith('@')) {
                        const _file = file(`./pages/${data.replace('@', '')}${ext}`)
                        if (await _file.exists()) {
                            const layout = await file('./pages/layout' + ext).text()
                            if (layout) {
                                const template = Handlebars.compile(layout);

                                //? now we need compile also the real template
                                const _template = Handlebars.compile(await _file.text());
                                input.body = _template(input);
                                input.opt = opt;
                                html = template(input);
                            }
                        } else {
                            return BunziiError.throw(`Template ${data} not found`, null, 502)
                        }
                    } else {
                        const template = Handlebars.compile(data);
                        html = template(input);
                    }
                    return new Response(html, { status: this.statusCode, headers: this.headers })
                }
                default:
                    return new Response(`Template ${data} not found`, { status: 404 })
            }
        } catch (e: Error | any) {
            return BunziiError.throw(e, e.stack, 500)
        }
    }

    public status(code: number) {
        this.statusCode = code;
        return this;
    }
}