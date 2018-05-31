import {EventEmitter} from "events";
import WebSocket from "ws";
import uuid from "uuid";

import {WebSocketMessenger, clientRegistration} from "@micropresence/protocol";

export interface Client {
    connection: WebSocket;
    redirectHost: string;
    authToken: string;
}

export enum Event {
    Registration = "registration",
    Close = "close",
    Error = "error"
}

export class ClientManager extends EventEmitter {
    static Event = Event;
    private static instance: ClientManager;

    private clientsByConnection: Map<WebSocket, Client> = new Map();
    private clientsByRedirectHost: Map<string, Client> = new Map();

    static getInstance(): ClientManager {
        if (!ClientManager.instance) {
            ClientManager.instance = new ClientManager();
        }
        return ClientManager.instance;
    }

    private constructor() {
        super();
    }

    manage(connection: WebSocket): void {
        this.manageLifetime(connection);
        this.awaitRegistration(connection);
    }

    count(): number {
        return this.clientsByConnection.size;
    }

    getClientByRedirectHost(redirectHost: string): Client | undefined {
        return this.clientsByRedirectHost.get(redirectHost);
    }

    private manageLifetime(connection: WebSocket): void {
        connection.once("close", (code, number) => {
            const client = this.clientsByConnection.get(connection);
            if (client) {
                this.clientsByConnection.delete(connection);
                this.clientsByRedirectHost.delete(client.redirectHost);
            }
            this.emit(Event.Close, {code, number, client});
        });

        connection.on("error", error => {
            this.emit(Event.Error, {error, client: this.clientsByConnection.get(connection)});
        });
    }

    private async awaitRegistration(connection: WebSocket): Promise<clientRegistration.Response> {
        const messenger = new WebSocketMessenger(connection);
        const {message, messageType, channel, dialogId} = await messenger.nextByChannel(clientRegistration.channel);
        if (!clientRegistration.isRequest(messageType, message)) {
            throw new Error("Unexpected clientRegistration request");
        }
        const {redirectHost} = message;
        if (this.clientsByRedirectHost.has(redirectHost)) {
            const rejection: clientRegistration.Rejection = {
                reason: "redirectHostExists"
            };
            await messenger.send(channel, clientRegistration.MessageType.Rejection, rejection, dialogId);
            return rejection;
        }

        const authToken = uuid.v4();
        const client: Client = {redirectHost, connection, authToken};
        this.clientsByConnection.set(connection, client);
        this.clientsByRedirectHost.set(redirectHost, client);
        this.emit(Event.Registration, client);
        const ok: clientRegistration.Ok = {authToken};
        await messenger.send(channel, clientRegistration.MessageType.Ok, ok, dialogId);
        return ok;
    }
}
