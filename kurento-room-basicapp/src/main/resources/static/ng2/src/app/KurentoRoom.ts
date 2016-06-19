/*
 * (C) Copyright 2016 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
// KurentoRoom --------------------------------

import { Stream } from './Stream'
import { Room } from './Room'
import {RoomOptions } from './options.model'

declare var RpcBuilder: any;

export class KurentoRoom {

    private room: Room;
    private userName: string;
    private jsonRpcClient: any;
    private rpcParams: any;
    private callback: (error?: string, kurento?: KurentoRoom) => any;

    constructor(private wsUri: string) { }

    connect(callback: (error?: string, kurento?: KurentoRoom) => any) {

        this.callback = callback;

        let config = {
            heartbeat: 3000,
            sendCloseMessage: false,
            ws: {
                uri: this.wsUri,
                useSockJS: false,
                onconnected: this.connectCallback.bind(this),
                ondisconnect: this.disconnectCallback.bind(this),
                onreconnecting: this.reconnectingCallback.bind(this),
                onreconnected: this.reconnectedCallback.bind(this)
            },
            rpc: {
                requestTimeout: 15000,
                //notifications
                participantJoined: this.onParticipantJoined.bind(this),
                participantPublished: this.onParticipantPublished.bind(this),
                participantLeft: this.onParticipantLeft.bind(this),
                participantEvicted: this.onParticipantEvicted.bind(this),
                sendMessage: this.onNewMessage.bind(this),
                iceCandidate: this.iceCandidateEvent.bind(this),
                mediaError: this.onMediaError.bind(this)
            }
        };
        this.jsonRpcClient = new RpcBuilder.clients.JsonRpcClient(config);

    }

    private connectCallback(error: string) {
        if (error) {
            this.callback(error);
        } else {
            this.callback(null, this);
        }
    }

    private isRoomAvailable() {
        if (this.room) {
            return true;
        } else {
            console.warn('Room instance not found');
            return false;
        }
    }

    private disconnectCallback() {
        console.log('Websocket connection lost');
        
        if (this.isRoomAvailable()) {
            this.room.onLostConnection();
        } else {
            alert('Connection error. Please reload page.');
        }
    }

    private reconnectingCallback() {
        console.log('Websocket connection lost (reconnecting)');
        
        if (this.isRoomAvailable()) {
            this.room.onLostConnection();
        } else {
            alert('Connection error. Please reload page.');
        }
    }

    private reconnectedCallback() {
        console.log('Websocket reconnected');
    }

    private onParticipantJoined(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantJoined(params);
        }
    }

    private onParticipantPublished(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantPublished(params);
        }
    }

    private onParticipantLeft(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantLeft(params);
        }
    }

    private onParticipantEvicted(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantEvicted(params);
        }
    }

    private onNewMessage(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onNewMessage(params);
        }
    }

    private iceCandidateEvent(params: any) {
        if (this.isRoomAvailable()) {
            this.room.recvIceCandidate(params);
        }
    }

    private onRoomClosed(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onRoomClosed(params);
        }
    }

    private onMediaError(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onMediaError(params);
        }
    }

    private setRpcParams(params: any) {
        this.rpcParams = params;
    }

    sendRequest(method: string, params: any, callback?: any) {
        
        if (params && params instanceof Function) {
            callback = params;
            params = undefined;
        }
        
        params = params || {};

        if (this.rpcParams && this.rpcParams !== "null" && this.rpcParams !== "undefined") {
            for (var index in this.rpcParams) {
                if (this.rpcParams.hasOwnProperty(index)) {
                    params[index] = this.rpcParams[index];
                    console.log('RPC param added to request {' + index + ': ' + this.rpcParams[index] + '}');
                }
            }
        }
        
        console.log('Sending request: { method:"' + method + '", params: ' + JSON.stringify(params) + ' }');
        this.jsonRpcClient.send(method, params, callback);
    };

    close(forced?: boolean) {
        if (this.isRoomAvailable()) {
            this.room.leave(forced, this.jsonRpcClient);
        }
    };

    private disconnectParticipant(stream: Stream) {
        if (this.isRoomAvailable()) {
            this.room.disconnect(stream);
        }
    }

    createStream(room: Room, options: any) {
        options.participant = room.getLocalParticipant();
        return new Stream(this, true, room, options);
    };

    createRoom(options: RoomOptions) {
        this.room = new Room(this, options);
        return this.room;
    };

    private sendMessage(room: string, user: string, message: string) {
        
        this.sendRequest('sendMessage', { message: message, userMessage: user, roomMessage: room }, (error, response) => {
            if (error) {
                console.error(error);
            }
        });
    };

    private sendCustomRequest(params: any, callback: any) {
        this.sendRequest('customRequest', params, callback);
    };
}
