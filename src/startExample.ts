import {BrokerService} from "./";

async function start(): Promise<void> {
    const service = new BrokerService({port: 3000});

    service.onAny(console.log);
    service.clientManager.onAny(console.log);

    await service.start();
    console.log("Broker is listening", service.fastify.server.address());
}

start();
