import * as http from "http";
import * as fastify from "fastify";

const endpoint = "/targets";

const registerTargets: fastify.RouteOptions<http.Server, http.IncomingMessage, http.ServerResponse> = {
    method: "POST",
    url: endpoint,
    async handler(request, reply) {
        return {test: "jepp"};
    }
};

const plugin: fastify.Plugin<http.Server, http.IncomingMessage, http.ServerResponse, any> = (fastify, opts, next) => {
    fastify.route(registerTargets);
    next();
};

export default plugin;
