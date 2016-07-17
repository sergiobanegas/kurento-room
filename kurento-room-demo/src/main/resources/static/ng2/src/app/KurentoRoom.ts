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
import {RoomOptions, ParticipantOptions, MessageOptions, StreamOptions } from './options.model'
import * as k from "./KurentoJsonRpc.d"

declare var RpcBuilder: any;

export class KurentoRoom {

    private room: Room;
    private userName: string;
    private jsonRpcClient: k.JsonRpcClient;
    private rpcParams: any;
    private callback: (error?: string, kurento?: KurentoRoom) => any;

    constructor(private wsUri: string) { }

    getRoom(){
        return this.room;
    }
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

    connectCallback(error: string) {
        if (error) {
            this.callback(error);
        } else {
            this.callback(null, this);
        }
    }

    isRoomAvailable() {
        if (this.room) {
            return true;
        } else {
            console.warn('Room instance not found');
            return false;
        }
    }

    disconnectCallback() {
        console.log('Websocket connection lost');
        
        if (this.isRoomAvailable()) {
            this.room.onLostConnection();
        } else {
            alert('Connection error. Please reload page.');
        }
    }

    reconnectingCallback() {
        console.log('Websocket connection lost (reconnecting)');
        
        if (this.isRoomAvailable()) {
            this.room.onLostConnection();
        } else {
            alert('Connection error. Please reload page.');
        }
    }

    reconnectedCallback() {
        console.log('Websocket reconnected');
    }

    onParticipantJoined(params: ParticipantOptions) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantJoined(params);
        }
    }

    onParticipantPublished(params: ParticipantOptions) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantPublished(params);
        }
    }

    onParticipantLeft(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantLeft(params);
        }
    }

    onParticipantEvicted(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantEvicted(params);
        }
    }

    onNewMessage(params: MessageOptions) {
        if (this.isRoomAvailable()) {
            this.room.onNewMessage(params);
        }
    }

    iceCandidateEvent(params: any) {
        if (this.isRoomAvailable()) {
            this.room.recvIceCandidate(params);
        }
    }

    onRoomClosed(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onRoomClosed(params);
        }
    }

   onMediaError(params: any) {
        if (this.isRoomAvailable()) {
            this.room.onMediaError(params);
        }
    }

    setRpcParams(params: any) {
        this.rpcParams = params;
    }

    sendRequest(method: string, params: any, callback?: Function) {
        
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

    disconnectParticipant(stream: Stream) {
        if (this.isRoomAvailable()) {
            this.room.disconnect(stream);
        }
    }

    createStream(room: Room, options: StreamOptions) {
        options.participant = room.getLocalParticipant();
        return new Stream(this, true, room, options);
    };

    createRoom(options: RoomOptions) {
        this.room = new Room(this, options);
        return this.room;
    };

    sendMessage(room: string, user: string, message: string) {
        
        this.sendRequest('sendMessage', { message: message, userMessage: user, roomMessage: room }, (error:string, response:any) => {
            if (error) {
                console.error(error);
            }
        });
    };

    sendCustomRequest(params: any, callback: Function) {
        this.sendRequest('customRequest', params, callback);
    };
}
