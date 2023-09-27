
/// <reference types="bun-types" />
export interface BunziiHeaders extends Map<string, string> { }

export type BunziiPlugins = {
    [key: string]: any
}

export interface BunziiFunction extends Function {
    (req: BunziiRequest, res: BunziiResponse): void | Response | Promise<Response>;
}

export type BunziiParams = {
    [key: string]: {}
}

export type BunziiContent = {
    [key: string]: {}
} | string | Blob | ArrayBuffer | FormData | ReadableStream<Uint8Array> | null | undefined

export interface BunziiRequest extends Request {
    params: BunziiParams,
    content: BunziiContent | any,
    query: any;
    parsedURL: URLWrapper;
}

export type BunziiConfig = {
    plugins: {},
    static: {
        dir: string,
        allowed: boolean
    },
    server: Server
}