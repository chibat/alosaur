import { SameSite } from "https://deno.land/std@0.74.0/http/cookie.ts";
import { SessionStore } from "./store/store.interface.ts";

export interface SessionInterface {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  store: SessionStore;
}

export interface SessionOptions {
  cookieKey?: string;
  /** Expiration date of the cookie. */
  expires?: Date;
  /** Max-Age of the Cookie. Must be integer superior to 0. */
  maxAge?: number;
  /** Specifies those hosts to which the cookie will be sent. */
  domain?: string;
  /** Indicates a URL path that must exist in the request. */
  path?: string;
  /** Indicates if the cookie is made using SSL & HTTPS. */
  secure?: boolean;
  /** Indicates that cookie is not accessible via JavaScript. **/
  httpOnly?: boolean;
  /** Allows servers to assert that a cookie ought not to
   * be sent along with cross-site requests. */
  sameSite?: SameSite;
}
