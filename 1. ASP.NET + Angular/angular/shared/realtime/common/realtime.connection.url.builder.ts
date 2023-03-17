import { AppConsts } from '@shared/AppConsts';
import { ArgumentException } from '@custom/shared/exceptions';

export class ConnectionUrlBuilder {
    private readonly serviceBaseUrl = AppConsts.remoteServiceBaseUrl;

    private _urlPath: string;
    constructor(urlPath: string) {
        if (urlPath && urlPath[0] === '/') {
            urlPath = urlPath.substr(1);
        }
        if (!urlPath) {
            throw new ArgumentException(nameof(urlPath));
        }
        this._urlPath = urlPath;
    }

    private _baseUrl: string = this.serviceBaseUrl;
    public withBaseUrl(url?: string): ConnectionUrlBuilder {
        this._baseUrl = url ?? this.serviceBaseUrl;
        return this;
    }

    get baseUrl(): string {
        const length = this._baseUrl.length;
        if (this._baseUrl[length - 1] === '/') {
            return this._baseUrl;
        }
        return this._baseUrl + '/';
    }

    private _baseUrlQuery: string;
    public withBaseUrlQuery(url?: string): ConnectionUrlBuilder {
        this._baseUrlQuery = url ?? this.serviceBaseUrl;
        return this;
    }

    private _buildUrl: string;
    private _buildQueryParamSeprator: string;

    public build(): string {
        this._buildQueryParamSeprator = '?';
        this._buildUrl = `${this.baseUrl}${this._urlPath}`;
        this.tryAddQueryParam(this.baseUrlQUeryParam);
        return this._buildUrl;
    }

    private tryAddQueryParam(param: string) {
        if (param) {
            this.addQueryParam(param);
        }
    }

    private addQueryParam(param: string) {
        this._buildUrl += this._buildQueryParamSeprator + param;
        this._buildQueryParamSeprator = '&';
    }


    private get baseUrlQUeryParam(): string {
        if (this._baseUrlQuery) {
            return `base-url=${encodeURIComponent(this._baseUrlQuery)}`;
        }
        return '';
    }
}
