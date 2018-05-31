import {BrokerService} from "./";

async function start(): Promise<void> {
    const service = new BrokerService();
    return service.start();
}

start();
