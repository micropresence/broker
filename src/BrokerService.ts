import Fastify from "fastify";
import Pino from "pino";
import WebSocket from "ws";

import catchAllRedirectRoute from "./routes/catchAllRedirect";
import targetsRoutes from "./routes/targets";
import {ClientManager} from "./ClientManager";

export interface Config {
    port: number;
    fastify?: Fastify.ServerOptions;
    pino?: Pino.LoggerOptions;
    wsServer?: WebSocket.ServerOptions;
}

export class BrokerService {
    private fastify = Fastify(this.config.fastify);
    private log = Pino(this.config.pino);
    private wsServer = new WebSocket.Server({...this.config.wsServer, server: this.fastify.server});
    private clientManager = ClientManager.getInstance();

    constructor(private config: Config = {}) {
        this.fastify.register(catchAllRedirectRoute);
        this.fastify.register(targetsRoutes);

        this.wsServer.on("connection", connection => {
            this.clientManager.manage(connection);
            connection.on("message", message => this.log.debug("message", message));
        });
        this.clientManager.on(ClientManager.Event.Registration, data => this.log.debug("registration"));
        this.clientManager.on(ClientManager.Event.Close, data => this.log.debug("close"));
    }

    async start(): Promise<void> {
        await this.fastify.listen(this.config.port);
    }
}
