import { BunziiHeaders } from '../types/core'
import BunziiError from './BunziiError';

export class BunziiResponse {
    private readonly configuration: {
        headers: BunziiHeaders,
        status: number,
        query?: any
    }

    constructor(options: { headers: BunziiHeaders, others?: any }) {
        this.configuration = {
            headers: options.headers,
            status: 200
        }
    }

    public send = (str: any): Response => new Response(str, { status: this.configuration.status, headers: Object.fromEntries(this.configuration.headers) })
    public json = (obj: any): Response => {
        try {
            this.configuration.headers.set('Content-Type', 'application/json');
            this.configuration.headers.set('Content-Type-X', 'application/json+bunzi')
            return Response.json(obj, { status: this.configuration.status, headers: Object.fromEntries(this.configuration.headers) })
        } catch (e: any) {
            return BunziiError.throw(e, e.stack, 502)
        }
    }
    public sendFile = async (path: string): Promise<Response> => {
        try {
            return new Response(Bun.file(path), { status: this.configuration.status, headers: Object.fromEntries(this.configuration.headers) })
        } catch (e: any) {
            return BunziiError.throw(e, e.stack, 502)
        }
    }

    public status = (code: number): BunziiResponse => {
        this.configuration.status = code;
        return this;
    }

    public render = async (data: any, input: any, opt: any) => {

    }
}