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
 
import {KurentoRoom} from './KurentoRoom'
import {Stream} from './Stream'
import {Participant} from './Participant'
import {RoomOptions, ParticipantOptions, MessageOptions} from './options.model'

declare var EventEmitter: any;

export class Room {
    
    private name:string;
    private streams: Stream[] = [];
    private participants: Participant[] = [];
    private participantsSpeaking: string[] = [];
    private connected = false;
    private localParticipant: Participant;
    private subscribeToStreams: any;
    private updateSpeakerInterval: any;
    private thresholdSpeaker: any;
    private ee: any;

    constructor(private kurento: KurentoRoom, private options: RoomOptions) {
        this.ee = new EventEmitter();
        this.name = options.room;
        this.subscribeToStreams = options.subscribeToStreams || true;
        this.updateSpeakerInterval = options.updateSpeakerInterval || 1500;
        this.thresholdSpeaker = options.thresholdSpeaker || -50;
        setInterval(this.updateMainSpeaker.bind(this), this.updateSpeakerInterval);
        this.localParticipant = new Participant(this.kurento, true, this, { id: this.options.user, streams: null });
        this.participants[this.options.user] = this.localParticipant;
    }

    getParticipants(){
        return this.participants;
    }

    updateMainSpeaker() {
        
        if (this.participantsSpeaking.length > 0) {
            
            this.ee.emitEvent('update-main-speaker', [{
                participantId: this.participantsSpeaking[this.participantsSpeaking.length - 1]
            }]);
        }    
    }

    getName() {
        return this.name;
    }

    getLocalParticipant () {
        return this.localParticipant;
    }

    getThresholdSpeaker () {
        return this.getThresholdSpeaker;
    }

    addEventListener (eventName:string, listener:any) {
        this.ee.addListener(eventName, listener);
    }

    emitEvent(eventName:string, eventsArray:any[]) {
        this.ee.emitEvent(eventName, eventsArray);
    }

    connect() {
        
        this.kurento.sendRequest('joinRoom', {
            user: this.options.user,
            room: this.options.room
        }, (error, response) => {
            if (error) {
                console.warn('Unable to join room', error);
                this.ee.emitEvent('error-room', [{
                    error: error
                }]);
            } else {

                this.connected = true;

                let exParticipants = response.value;

                let roomEvent = {
                    participants: [],
                    streams: []
                }

                for (var exParticipant of exParticipants) {

                    let participant = new Participant(this.kurento, false, this,
                        exParticipant);

                    this.participants[participant.getID()] = participant;

                    roomEvent.participants.push(participant);

                    let streams = participant.getStreams();
                    for (var key in streams) {
                        roomEvent.streams.push(streams[key]);
                        if (this.subscribeToStreams) {
                            streams[key].subscribe();
                        }
                    }
                }

                this.ee.emitEvent('room-connected', [roomEvent]);
            }
        });
    }

    subscribe(stream:Stream) {
        stream.subscribe();
    }

    onParticipantPublished(options:ParticipantOptions) {

        let participant = new Participant(this.kurento, false, this, options);
        
        let pid = participant.getID(); 
        if (!(pid in this.participants)) {
            console.info("Publisher not found in participants list by its id", pid);
        } else {
            console.log("Publisher found in participants list by its id", pid);
        }
        
        //replacing old participant (this one has streams)
        this.participants[pid] = participant;

        this.ee.emitEvent('participant-published', [{
            participant: participant
        }]);

        let streams = participant.getStreams();
        for (var i in streams) {
            if (this.subscribeToStreams) {
                streams[i].subscribe();
                this.ee.emitEvent('stream-added', [{
                    stream: streams[i]
                }]);
            }
        }
    }

    onParticipantJoined(msg: ParticipantOptions) {
        
        let participant = new Participant(this.kurento, false, this, msg);
        let pid = participant.getID();
        
        if (!(pid in this.participants)) {
            console.log("New participant to participants list with id", pid);
            this.participants[pid] = participant;
            
        } else {
            //use existing so that we don't lose streams info
            console.info("Participant already exists in participants list with " +
                "the same id, old:", this.participants[pid], ", joined now:", participant);
            participant = this.participants[pid];
        }

        this.ee.emitEvent('participant-joined', [{
            participant: participant
        }]);
    }

    onParticipantLeft(msg:any) {

        let participant = this.participants[msg.name];

        if (participant !== undefined) {
            
            delete this.participants[msg.name];

            this.ee.emitEvent('participant-left', [{
                participant: participant
            }]);

            let streams = participant.getStreams();
            for (var stream of streams) {
                this.ee.emitEvent('stream-removed', [{
                    stream: stream
                }]);
            }
            participant.dispose();
            
        } else {
            console.warn("Participant " + msg.name
                + " unknown. Participants: "
                + JSON.stringify(this.participants));
        }
    };


    onParticipantEvicted(msg:any) {
        this.ee.emitEvent('participant-evicted', [{
            localParticipant: this.localParticipant
        }]);
    };

    onNewMessage(msg: MessageOptions) {
        
        console.log("New message: " + JSON.stringify(msg));
        
        let room = msg.room;
        let user = msg.user;
        let message = msg.message;

        if (user !== undefined) {
            this.ee.emitEvent('newMessage', [{ room, user, message }]);            
        } else {
            console.error("User undefined in new message:", msg);
        }
    }


    recvIceCandidate(msg:any) {
        
        let candidate = {
            candidate: msg.candidate,
            sdpMid: msg.sdpMid,
            sdpMLineIndex: msg.sdpMLineIndex
        }
        
        let participant = this.participants[msg.endpointName];
        
        if (!participant) {
            console.error("Participant not found for endpoint " +
                msg.endpointName + ". Ice candidate will be ignored.",
                candidate);
            return false;
        }
        
        let streams = participant.getStreams();
        for (var key in streams) {
            var stream = streams[key];
            stream.getWebRtcPeer().addIceCandidate(candidate, (error) => {
                if (error) {
                    console.error("Error adding candidate for " + key
                        + " stream of endpoint " + msg.endpointName
                        + ": " + error);
                    return;
                }
            });
        }
    }

    onRoomClosed(msg:any) {
        
        console.log("Room closed: " + JSON.stringify(msg));
        let room = msg.room;
        if (room !== undefined) {
            this.ee.emitEvent('room-closed', [{ room }]);
        } else {
            console.error("Room undefined in on room closed", msg);
        }
    }

    onLostConnection() {
        if (!this.connected) {
            console.warn('Not connected to room, ignoring lost connection notification');
            return false;
        }

        console.log('Lost connection in room ' + this.name);
        let room = this.name;
        if (room !== undefined) {
            this.ee.emitEvent('lost-connection', [{ room }]);
        } else {
            console.error('Room undefined when lost connection');
        }
    }

    onMediaError(params:any) {
        console.error("Media error: " + JSON.stringify(params));
        let error = params.error;
        if (error) {
            this.ee.emitEvent('error-media', [{ error }]);
        } else {
            console.error("Received undefined media error. Params:", params);
        }
    }

    leave(forced:boolean, jsonRpcClient:any) {
        
        forced = !!forced;
        console.log("Leaving room (forced=" + forced + ")");

        if (this.connected && !forced) {
            
            this.kurento.sendRequest('leaveRoom', (error, response) => {
                if (error) {
                    console.error(error);
                }
                jsonRpcClient.close();
            });
        } else {
            jsonRpcClient.close();
        }
        
        this.connected = false;
        
        if (this.participants) {
            for (var pid in this.participants) {
                this.participants[pid].dispose();
                delete this.participants[pid];
            }
        }
    }

    disconnect(stream: Stream) {
        
        let participant = stream.getParticipant();
        
        if (!participant) {
            console.error("Stream to disconnect has no participant", stream);
            return false;
        }

        delete this.participants[participant.getID()];
        participant.dispose();

        if (participant === this.localParticipant) {
            console.log("Unpublishing my media (I'm " + participant.getID() + ")");
            delete this.localParticipant;
            this.kurento.sendRequest('unpublishVideo', (error, response) => {
                if (error) {
                    console.error(error);
                } else {
                    console.info("Media unpublished correctly");
                }
            });
        } else {
            console.log("Unsubscribing from " + stream.getGlobalID());
            this.kurento.sendRequest('unsubscribeFromVideo', {
                sender: stream.getGlobalID()
            },
                (error, response)=> {
                    if (error) {
                        console.error(error);
                    } else {
                        console.info("Unsubscribed correctly from " + stream.getGlobalID());
                    }
                });
        }
    }

    getStreams() {
        return this.streams;
    }

    addStream(stream: Stream){
        for (let i in this.streams) {
            if (stream.getID() == this.streams[i].getID()) {
                this.streams[i] = stream;
                return;
            }
        }
        this.streams.push(stream);
    }

    addParticipantSpeaking(participantId:string) {
        this.participantsSpeaking.push(participantId);
    }

    removeParticipantSpeaking(participantId:string) {
        
        let pos = -1;
        for (var i = 0; i < this.participantsSpeaking.length; i++) {
            if (this.participantsSpeaking[i] == participantId) {
                pos = i;
                break;
            }
        }
        if (pos != -1) {
            this.participantsSpeaking.splice(pos, 1);
        }
    }
               
}