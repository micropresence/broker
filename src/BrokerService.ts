import Emittery from "emittery";
import Fastify from "fastify";
import WebSocket from "ws";

import catchAllRedirectRoute from "./routes/catchAllRedirect";
import targetsRoutes from "./routes/targets";
import {ClientManager} from "./ClientManager";

export interface Config {
    port: number;
    fastify?: Fastify.ServerOptions;
    wsServer?: WebSocket.ServerOptions;
}

interface Events {
    error: any;
}

export class BrokerService extends Emittery.Typed<Events> {
    readonly fastify = Fastify(this.config.fastify);
    readonly wsServer = new WebSocket.Server({...this.config.wsServer, server: this.fastify.server});
    readonly clientManager = ClientManager.getInstance();

    constructor(readonly config: Config) {
        super();
        this.fastify.register(catchAllRedirectRoute);
        this.fastify.register(targetsRoutes);

        this.wsServer.on("error", err => this.emit("error", err));
        this.clientManager.on("error", err => this.emit("error", err));

        this.wsServer.on("connection", connection => {
            this.clientManager.manage(connection);
        });
    }

    async start(): Promise<void> {
        await this.fastify.listen(this.config.port);
    }
}
