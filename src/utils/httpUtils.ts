import {IncomingMessage} from "http";
import {omit} from "ramda";

export function getHeaderString(name: string, headers: IncomingMessage["headers"]): string | null {
    const header = headers[name];
    if (!header) {
        return null;
    }
    return typeof header === "string" ? header : header[0];
}

// Proxies should remove Hop-by-hop Headers
// https://www.mnot.net/blog/2011/07/11/what_proxies_must_do
// https://tools.ietf.org/html/draft-ietf-httpbis-p1-messaging-14#section-7.1.3
export const hopByHopHeaderFields = [
    "Connection",
    "Keep-Alive",
    "Proxy-Authenticate",
    "Proxy-Authorization",
    "TE",
    "Trailer",
    "Transfer-Encoding",
    "Upgrade"
].map(header => header.toLowerCase());

export const omitHopByHopHeaders = omit(hopByHopHeaderFields);
