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

import {Stream} from './Stream'
import {Room} from './Room'

declare var RpcBuilder: any;

export class KurentoRoom{
  private room: Room;
  private userName: string;
  private jsonRpcClient:any;
  private rpcParams:any;

  constructor(private wsUri: string, private callback: (error?:string, kurento?:KurentoRoom) => any) {
    if (!(this instanceof KurentoRoom))
      return new KurentoRoom(wsUri, callback);
  }

  initJsonRpcClient() {

    let config = {
      heartbeat: 3000,
      sendCloseMessage: false,
      ws: {
        uri: this.wsUri,
        useSockJS: false,
        onconnected: this.connectCallback,
        ondisconnect: this.disconnectCallback,
        onreconnecting: this.reconnectingCallback,
        onreconnected: this.reconnectedCallback
      },
      rpc: {
        requestTimeout: 15000,
            //notifications
            participantJoined: this.onParticipantJoined,
            participantPublished: this.onParticipantPublished,
            participantLeft: this.onParticipantLeft,
            participantEvicted: this.onParticipantEvicted,
            sendMessage: this.onNewMessage,
            iceCandidate: this.iceCandidateEvent,
            mediaError: this.onMediaError
          }
        };
        this.jsonRpcClient = new RpcBuilder.clients.JsonRpcClient(config);
      }
    //FIXME: callback doesn't work 
    connectCallback(error:string) {
      if (error) {
        this.callback(error);
      } else {
        this.callback(null, this);
      }
    }

    isRoomAvailable() {
      if (this.room !== undefined && this.room instanceof Room) {
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

    onParticipantJoined(params:any) {
      if (this.isRoomAvailable()) {
        this.room.onParticipantJoined(params);
      }
    }

    onParticipantPublished(params:any) {
      if (this.isRoomAvailable()) {
        this.room.onParticipantPublished(params);
      }
    }

    onParticipantLeft(params:any) {
      if (this.isRoomAvailable()) {
        this.room.onParticipantLeft(params);
      }
    }

    onParticipantEvicted(params:any) {
      if (this.isRoomAvailable()) {
        this.room.onParticipantEvicted(params);
      }
    }

    onNewMessage(params:any) {
      if (this.isRoomAvailable()) {
        this.room.onNewMessage(params);
      }
    }

    iceCandidateEvent(params:any) {
      if (this.isRoomAvailable()) {
        this.room.recvIceCandidate(params);
      }
    }

    onRoomClosed(params:any) {
      if (this.isRoomAvailable()) {
        this.room.onRoomClosed(params);
      }
    }

    onMediaError(params:any) {
      if (this.isRoomAvailable()) {
        this.room.onMediaError(params);
      }
    }

    setRpcParams (params:any) {
      this.rpcParams = params;
    }

    //sendRequest (method:string, params?:any, callback:any) {
	sendRequest(method: string, callback:any, params?: any) {
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

    close (forced?:any) {
      if (this.isRoomAvailable()) {
        this.room.leave(forced, this.jsonRpcClient);
      }
    };

    disconnectParticipant (stream:Stream) {
      if (this.isRoomAvailable()) {
        this.room.disconnect(stream);
      }
    }
    
    Stream (room:Room, options:any) {
      options.participant = room.getLocalParticipant();
      return new Stream(this, true, room, options);
    };

    Room (options:any) {
      this.room = new Room(this, options);
      return this.room;
    };

    //CHAT
    sendMessage (room:any, user:any, message:string) {
      this.sendRequest('sendMessage', {message: message, userMessage: user, roomMessage: room}, (error, response) => {
        if (error) {
          console.error(error);
        }
      });
    };
    
    sendCustomRequest (params:any, callback:any) {
      this.sendRequest('customRequest', params, callback);
    };    

    
  }
