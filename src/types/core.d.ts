
/// <reference types="bun-types" />
export declare class Bunzii {
    private routes;
    private routeCache;
    private server;
    private headers;
    private engine;
    constructor();
    private findRoute;
    get(path: string, handler: Function): void;
    post(path: string, handler: Function): void;
    put(path: string, handler: Function): void;
    patch(path: string, handler: Function): void;
    delete(path: string, handler: Function): void;
    redirect(path: string): void;
    listen(port: number): void;
}

export declare class BunziResponse {
    private statusCode;
    private headers;
    private engine;
    private engine_partiar;
    constructor(options: {
        headers: Headers;
        template_engine: {
            name: string;
            allowedPartiars: string[];
        };
    });
    status(code: number): BunziResponse;
    send(str: any): Response;
    json(obj: any): Response | Error;
    sendFile(path: string): Response | Error;
    render(data: any, input: any): Promise<Response | Error>;
}

export type BunziParams = {
    [key: string]: {}
}

export interface IBunziResponse {
    send(str: any): Response;
    json(obj: any): Response | Error;
    sendFile(path: string): Response | Error;
    render(data: any, input: any): Promise<Response | Error>;
}

export interface BunziEngine {
    name: string;
    allowedPartiars: string[];
}

export type BunziTemplateEngine = {
    name: string,
    allowedPartiars: string[]
}

export declare class BunziiError {
    name: string;
    message: string;
    stack: string;
}

export type BunziContent = {
    [key: string]: {}
} | string | Blob | ArrayBuffer | FormData | ReadableStream<Uint8Array> | null | undefined

export interface BunzRequest extends Request {
    params: BunziParams,
    content: BunziContent | any,
    query: any;
}

export type BunzEngineRoute = {
    method: string,
    path: string,
    handler: Function,
    params: BunziParams
} | null

export type BunzEngineRoutes = {
    [key: string]: BunzEngineRoute
}

export type BunziResponseStatuses = {
    [key: string]: {
        short: string,
        long: string
    }
}

export default Bunzii;