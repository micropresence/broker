import * as http from "http";
import * as fastify from "fastify";

import {HttpOverWebSocket, HeaderFields} from "@micropresence/protocol";
import {ClientManager} from "../ClientManager";
import {getHeaderString, omitHopByHopHeaders} from "../utils/httpUtils";

const clientManager = ClientManager.getInstance();

const route: fastify.RouteOptions<http.Server, http.IncomingMessage, http.ServerResponse> = {
    method: ["DELETE", "GET", "HEAD", "PATCH", "POST", "PUT"],
    url: "/*",
    async handler(request, reply) {
        const authToken = getHeaderString(HeaderFields.AuthToken, request.req.headers);
        const redirectHost = getHeaderString(HeaderFields.RedirectHost, request.req.headers);
        const brokerHost = getHeaderString(HeaderFields.BrokerHost, request.req.headers);
        if (!authToken || !redirectHost || !brokerHost) {
            reply.code(400);
            return {error: "Missing micropresence header"};
        }

        const client = clientManager.getClientByRedirectHost(redirectHost);
        if (!client) {
            reply.code(400);
            return {error: "Invalid micropresence redirectHost"};
        }
        if (authToken !== client.authToken) {
            reply.code(403);
            return {error: "Invalid micropresence authToken"};
        }

        const httpOverWs = new HttpOverWebSocket(client.connection);
        const response = await httpOverWs.request({
            method: request.req.method!,
            path: request.req.url!,
            headers: request.req.headers,
            body: request.body
        });
        if (!HttpOverWebSocket.isResponse(response)) {
            reply.code(500);
            return HttpOverWebSocket.isRequestError(response) ? response : {error: "Invalid response"};
        }
        reply.code(response.status);
        reply.headers(omitHopByHopHeaders(response.headers));
        return response.body;
    }
};

const plugin: fastify.Plugin<http.Server, http.IncomingMessage, http.ServerResponse, any> = (fastify, opts, next) => {
    fastify.route(route);
    next();
};

export default plugin;
