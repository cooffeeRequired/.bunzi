/**
 * A wrapper around browser's URL for some utility params.
 *
 * @author coffeeRequired
 */

import QueryParams from 'fast-querystring';

export interface URLWrapperParams extends Record<string, string> {
    [key: string]: string;
}

export default class URLWrapper {

    private readonly _url: URL | undefined;
    private readonly _params: URLWrapperParams | undefined;

    constructor(rawURL: string) {
        try {
            this._url = new URL(rawURL);
            this._params = QueryParams.parse(this._url.search.substring(1));
        } catch (e) {
            console.error('Un-parsable URL', e);
        }
    }

    /**
     * Method to get the value from the search params. Also handle any string of 'undefined' or 'null'.
     * @param name The parameter name to get the value
     * @return The parameter value. Return empty string if not available.
     */
    getParam(name?: string | null): string | undefined | URLWrapperParams {
        if (!this._params) {
            return '';
        }
        return !name ? this._params : this._params[name];
    }

    getPath(): string | undefined {
        if (this._url)
            return this._url.pathname;
    }
}