import { NextRequest } from 'next/server';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

class ApiRequest {
  private _url: string;
  private _method: Method;
  private _headers: Record<string, string> = {};
  private _body: unknown;
  private _cookies: Record<string, string> = {};

  constructor(url: string, method: Method) {
    this._url = url.startsWith('http') ? url : `${process.env.API_BASE_URL ?? 'http://localhost:3000'}${url}`;
    this._method = method;
  }

  header(name: string, value: string): this {
    this._headers[name] = value;
    return this;
  }

  cookie(name: string, value: string): this {
    this._cookies[name] = value;
    return this;
  }

  cartToken(token: string): this {
    return this.cookie('cartToken', token);
  }

  authToken(token: string): this {
    return this.header('Authorization', `Bearer ${token}`);
  }

  stripeSignature(sig: string): this {
    return this.header('stripe-signature', sig);
  }

  body(payload: unknown): this {
    this._body = payload;
    return this;
  }

  json(payload: unknown): this {
    this._headers['Content-Type'] = 'application/json';
    return this.body(JSON.stringify(payload));
  }

  build(): NextRequest {
    const headers = new Headers(this._headers);

    if (Object.keys(this._cookies).length > 0) {
      const cookieStr = Object.entries(this._cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      headers.set('cookie', cookieStr);
    }

    return new NextRequest(this._url, {
      method: this._method,
      headers,
      body: this._body != null ? (this._body as BodyInit) : undefined,
    });
  }
}

export const request = {
  get: (url: string) => new ApiRequest(url, 'GET'),
  post: (url: string) => new ApiRequest(url, 'POST'),
  put: (url: string) => new ApiRequest(url, 'PUT'),
  patch: (url: string) => new ApiRequest(url, 'PATCH'),
  delete: (url: string) => new ApiRequest(url, 'DELETE'),
};
