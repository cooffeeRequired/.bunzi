export type BunziParams = {
    [key: string]: {}
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
} | null // Ahha!

export type BunzEngineRoutes = {
    [key: string]: BunzEngineRoute
}

export type BunziResponseStatuses = {
    [key: string]: {
        short: string,
        long: string
    }
}