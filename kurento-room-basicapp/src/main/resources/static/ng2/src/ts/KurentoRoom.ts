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
// Room --------------------------------
import {Component, Input, Output, EventEmitter} from '@angular/core';
function jq( myid ) {
 
    return "#" + myid.replace( /(@|:|\.|\[|\]|,)/g, "\\$1" );
 
}


export class Room{
    private name;
    private streams;
    private participants:any[];
    private participantsSpeaking:any[] = [];
    private connected = false;
    private localParticipant;
    private subscribeToStreams;
    private updateSpeakerInterval;
    private thresholdSpeaker;
    private ee: EventEmitter<any> = new EventEmitter();

    constructor(private kurento: any, private options: any) {
        this.ee = new EventEmitter();
        this.subscribeToStreams = options.subscribeToStreams || true;
        this.updateSpeakerInterval = options.updateSpeakerInterval || 1500;
        this.thresholdSpeaker = options.thresholdSpeaker || -50;
        setInterval(this.updateMainSpeaker, this.updateSpeakerInterval);
        this.localParticipant = new Participant(this.kurento, true, this, { id: this.options.user });
        this.participants[this.options.user] = this.localParticipant;
    }

    updateMainSpeaker() {
        if (this.participantsSpeaking.length > 0) {
            this.ee.emitEvent('update-main-speaker', [{
                participantId: this.participantsSpeaking[this.participantsSpeaking.length - 1]
            }]);
        }    
    }

    getLocalParticipant () {
        return this.localParticipant;
    }

    addEventListener (eventName, listener) {
        this.ee.addListener(eventName, listener);
    }

    emitEvent(eventName, eventsArray) {
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

                    let participant:any = new Participant(this.kurento, false, this,
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

    subscribe (stream) {
        stream.subscribe();
    }

    onParticipantPublished(options) {

        let participant = new Participant(this.kurento, false, this, options);
        let pid: any=participant.getID(); 
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

    onParticipantJoined(msg) {
        let participant = new Participant(this.kurento, false, this, msg);
        let pid:any = participant.getID();
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

    onParticipantLeft(msg) {

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


    onParticipantEvicted(msg) {
        this.ee.emitEvent('participant-evicted', [{
            localParticipant: this.localParticipant
        }]);
    };

    onNewMessage(msg) {
        console.log("New message: " + JSON.stringify(msg));
        let room = msg.room;
        let user = msg.user;
        let message = msg.message;

        if (user !== undefined) {
            this.ee.emitEvent('newMessage', [{
                room: room,
                user: user,
                message: message
            }]);
        } else {
            console.error("User undefined in new message:", msg);
        }
    }


    recvIceCandidate(msg) {
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

    onRoomClosed(msg) {
        console.log("Room closed: " + JSON.stringify(msg));
        let room = msg.room;
        if (room !== undefined) {
            this.ee.emitEvent('room-closed', [{
                room: room
            }]);
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
            this.ee.emitEvent('lost-connection', [{
                room: room
            }]);
        } else {
            console.error('Room undefined when lost connection');
        }
    }

    onMediaError(params) {
        console.error("Media error: " + JSON.stringify(params));
        let error = params.error;
        if (error) {
            this.ee.emitEvent('error-media', [{
                error: error
            }]);
        } else {
            console.error("Received undefined media error. Params:", params);
        }
    }

    leave(forced, jsonRpcClient) {
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

    disconnect(stream) {
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

    addParticipantSpeaking(participantId) {
        this.participantsSpeaking.push(participantId);
    }

    removeParticipantSpeaking(participantId) {
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

export class Participant{

    private id: Number;
    private streams = {};
    private streamsOpts:any[]= [];
    constructor(private kurento: any,private local: any, private room: any, private options:any){
        this.id = this.options.id;
        if (this.options.streams) {
            for (var streamOfOptions of this.options.streams) {
                let streamOpts = {
                    id: streamOfOptions.id,
                    participant: this,
                    recvVideo: (streamOfOptions.recvVideo == undefined ? true : streamOfOptions.recvVideo),
                    recvAudio: (streamOfOptions.recvAudio == undefined ? true : streamOfOptions.recvAudio)
                }
                let stream = new Stream(kurento, false, room, streamOpts);
                this.addStream(stream);
                this.streamsOpts.push(streamOpts);
            }
        }
        console.log("New " + (local ? "local " : "remote ") + "participant " + id
            + ", streams opts: ", this.streamsOpts);
    }

    setId(newId:Number) {
        this.id = newId;
    }

    addStream(stream) {
        this.streams[stream.getID()] = stream;
        this.room.getStreams()[stream.getID()] = stream;
    }

    //this.addStream = addStream;

    getStreams() {
        return this.streams;
    }

    dispose() {
        for (var key in this.streams) {
            this.streams[key].dispose();
        }
    }

    getID() {
        return this.id;
    }

    sendIceCandidate(candidate) {
        console.debug((this.local ? "Local" : "Remote"), "candidate for",
            this.getID(), JSON.stringify(candidate));
        this.kurento.sendRequest("onIceCandidate", {
            endpointName: this.getID(),
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex
        }, (error, response) => {
            if (error) {
                console.error("Error sending ICE candidate: "
                    + JSON.stringify(error));
            }
        });
    }

}

// Stream --------------------------------

/*
 * options: name: XXX data: true (Maybe this is based on webrtc) audio: true,
 * video: true, url: "file:///..." > Player screen: true > Desktop (implicit
 * video:true, audio:false) audio: true, video: true > Webcam
 *
 * stream.hasAudio(); stream.hasVideo(); stream.hasData();
 */
declare type JQuery = any;
declare var $: JQuery;
declare var kurentoUtils: any;
declare var getUserMedia: any;
declare var RTCSessionDescription: any;
declare var generateOffer: any;
export class Stream{
    private ee = new EventEmitter();
    private sdpOffer;
    private wrStream;
    private wp;
    private id;
    private video;
    private videoElements = [];
    private elements = [];
    private participant;
    private speechEvent;
    private recvVideo;
    private recvAudio;
    private showMyRemote = false;
    private localMirrored = false;

    constructor(private kurento: any, private local:any, private room:any, private options:any){
        if (this.options.id) {
            this.id = this.options.id;
        } else {
            this.id = "webcam";
        }
        this.participant = this.options.participant;
        this.recvVideo = this.options.recvVideo;
        this.recvAudio= options.recvAudio;
    }
    
    getRecvVideo () {
    	return this.recvVideo;
    }
 
    getRecvAudio() {
    	return this.recvAudio;
    }
    
    subscribeToMyRemote() {
    	this.showMyRemote = true;
    }

    displayMyRemote() {
    	return this.showMyRemote;
    }

    mirrorLocalStream (wr:any) {
    	this.showMyRemote = true;
    	this.localMirrored = true;
    	if (wr)
    		this.wrStream = wr;
    }

    isLocalMirrored() {
    	return this.localMirrored;
    }
    
    getWrStream() {
        return this.wrStream;
    }

    getWebRtcPeer () {
        return this.wp;
    }

    addEventListener (eventName:any, listener:any) {
        this.ee.addListener(eventName, listener);
    }

    showSpinner(spinnerParentId:string) {
        let progress = document.createElement('div');
        progress.id = 'progress-' + this.getGlobalID();
        progress.style.background = "center transparent url('img/spinner.gif') no-repeat";
        document.getElementById(spinnerParentId).appendChild(progress);
    }

    hideSpinner(spinnerId:string) {
    	spinnerId = (typeof spinnerId === 'undefined') ? this.getGlobalID() : spinnerId;
        $(jq('progress-' + spinnerId)).hide();
    }

    playOnlyVideo (parentElement, thumbnailId) {
        this.video = document.createElement('video');
        this.video.id = 'native-video-' + this.getGlobalID();
        this.video.autoplay = true;
        this.video.controls = false;
        if (this.wrStream) {
            this.video.src = URL.createObjectURL(this.wrStream);
        	$(jq(thumbnailId)).show();
            //this.hideSpinner(); ERROR-> hideSpinner must have one parameter
        } else
            console.log("No wrStream yet for", this.getGlobalID());

        this.videoElements.push({
        	thumb: thumbnailId,
            video: this.video
        });

        if (this.local) {
            this.video.muted = true;
        }

        if (typeof parentElement === "string") {
            document.getElementById(parentElement).appendChild(this.video);
        } else {
            parentElement.appendChild(this.video);
        }
    }

    playThumbnail (thumbnailId) {

        let container = document.createElement('div');
        container.className = "participant";
        container.id = this.getGlobalID();
        document.getElementById(thumbnailId).appendChild(container);

        this.elements.push(container);

        let name = document.createElement('div');
        container.appendChild(name);
        name.appendChild(document.createTextNode(this.getGlobalID()));
        name.id = "name-" + this.getGlobalID();
        name.className = "name";

        this.showSpinner(thumbnailId);

        this.playOnlyVideo(container, thumbnailId);
    }

    getID () {
        return this.id;
    }

    getParticipant () {
		return this.participant;
	}
    
    getGlobalID () {
        if (this.participant) {
            return this.participant.getID() + "_" + this.id;
        } else {
            return this.id + "_webcam";
        }
    }

    init () {
        this.participant.addStream(this);
        let constraints = {
            audio: true,
            video: {
                mandatory: {
                    maxWidth: 640
                },
                optional: [
                           {maxFrameRate: 15}, 
                           {minFrameRate: 15}
                           ]
            }
        };
        
        getUserMedia(constraints, (userStream)=> {
            this.wrStream = userStream;
            this.ee.emitEvent('access-accepted', null);
        }, (error) => {
            console.error("Access denied", error);
            this.ee.emitEvent('access-denied', null);
        });
    }

    publishVideoCallback (error, sdpOfferParam, wp) {
    	if (error) {
    		return console.error("(publish) SDP offer error: " 
    				+ JSON.stringify(error));
    	}
    	console.log("Sending SDP offer to publish as " 
            + this.getGlobalID(), sdpOfferParam);
        this.kurento.sendRequest("publishVideo", { 
        	sdpOffer: sdpOfferParam, 
            doLoopback: this.displayMyRemote() || false 
        }, (error, response) => {
        		if (error) {
	                console.error("Error on publishVideo: " + JSON.stringify(error));
	            } else {
                    this.room.emitEvent('stream-published', [{
                        stream: this
	                }])
                    this.processSdpAnswer(response.sdpAnswer);
	            }
        });
    }
    
    startVideoCallback (error, sdpOfferParam, wp) {
    	if (error) {
    		return console.error("(subscribe) SDP offer error: " 
    				+ JSON.stringify(error));
    	}
    	console.log("Sending SDP offer to subscribe to " 
            + this.getGlobalID(), sdpOfferParam);
        this.kurento.sendRequest("receiveVideoFrom", {
            sender: this.getGlobalID(),
            sdpOffer: sdpOfferParam
        }, (error, response) => {
            if (error) {
                console.error("Error on recvVideoFrom: " + JSON.stringify(error));
            } else {
                this.processSdpAnswer(response.sdpAnswer);
            }
        });
    }
    
    initWebRtcPeer(sdpOfferCallback) {
        if (this.local) {
        	 let options = {
                 videoStream: this.wrStream,
                 onicecandidate: this.participant.sendIceCandidate.bind(this.participant)
             }
             if (this.displayMyRemote()) {
                 this.wp = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, (error) => {
                	if(error) {
                		return console.error(error);
                	}
                    generateOffer(sdpOfferCallback.bind(this));
                });
        	} else {
                 this.wp = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, (error) => {
                	if(error) {
                		return console.error(error);
                	}
                    generateOffer(sdpOfferCallback.bind(this));
                });
        	}        	
        } else {
        	let offerConstraints = {
        			mandatory : {
                        OfferToReceiveVideo: this.recvVideo,
                        OfferToReceiveAudio: this.recvAudio
        			}
                };
        	console.log("Constraints of generate SDP offer (subscribing)", 
        			offerConstraints);
        	let options = {
                onicecandidate: this.participant.sendIceCandidate.bind(this.participant),
        		connectionConstraints: offerConstraints
            }
            this.wp = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, (error) => {
            	if(error) {
            		return console.error(error);
            	}
                generateOffer(sdpOfferCallback.bind(this));
            });
        }
        console.log("Waiting for SDP offer to be generated (" 
            + (this.local ? "local" : "remote") + " peer: " + this.getGlobalID() + ")");
    }

    publish () {

        // FIXME: Throw error when stream is not local

        this.initWebRtcPeer(this.publishVideoCallback);

        // FIXME: Now we have coupled connecting to a room and adding a
        // stream to this room. But in the new API, there are two steps.
        // This is the second step. For now, it do nothing.

    }

    subscribe () {

        // FIXME: In the current implementation all participants are subscribed
        // automatically to all other participants. We use this method only to
        // negotiate SDP

        this.initWebRtcPeer(this.startVideoCallback);
    }

    processSdpAnswer (sdpAnswer) {
        let answer = new RTCSessionDescription({
            type: 'answer',
            sdp: sdpAnswer,
        });
        console.log(this.getGlobalID() + ": set peer connection with recvd SDP answer", 
        		sdpAnswer);
        let participantId = this.getGlobalID();
        let pc = this.wp.peerConnection;
        pc.setRemoteDescription(answer, () => {
            // Avoids to subscribe to your own stream remotely 
        	// except when showMyRemote is true
            if (!this.local || this.displayMyRemote()) {
                this.wrStream = pc.getRemoteStreams()[0];
                console.log("Peer remote stream", this.wrStream);
                if (this.wrStream != undefined) {
                    this.speechEvent = kurentoUtils.WebRtcPeer.hark(this.wrStream, { threshold: this.room.thresholdSpeaker });
                    this.speechEvent.on('speaking', () => {
                        this.room.addParticipantSpeaking(participantId);
                        this.room.emitEvent('stream-speaking', [{
                        	   participantId: participantId
                           }]);
                    });
                    this.speechEvent.on('stopped_speaking', () => {
                        this.room.removeParticipantSpeaking(participantId);
                        this.room.emitEvent('stream-stopped-speaking', [{
                    	   participantId: participantId
                       }]);
                    });
                }
                for (var videoElement of this.videoElements) {
                	var thumbnailId = videoElement.thumb;
                    var video = videoElement.video;
                	video.src = URL.createObjectURL(this.wrStream);
                	video.onplay = () => {
                    	//is ('native-video-' + that.getGlobalID())
                    	let elementId = this.id;
                        let videoId = elementId.split("-");
                        $(jq(thumbnailId)).show();
                        this.hideSpinner(videoId[2]);
                    };
                }
                this.room.emitEvent('stream-subscribed', [{
                    stream: this
                    }]);
            }
        }, (error) => {
            console.error(this.getGlobalID() + ": Error setting SDP to the peer connection: "
            		+ JSON.stringify(error));
        });
    }

    unpublish () {
        if (this.wp) {
            this.dispose();
        } else { 
            if (this.wrStream) {
                this.wrStream.getAudioTracks().forEach((track) => {
	                track.stop && track.stop()
	            })
                this.wrStream.getVideoTracks().forEach((track) => {
	                track.stop && track.stop()
	            })
                this.speechEvent.stop();
        	}
        }

        console.log(this.getGlobalID() + ": Stream '" + this.id + "' unpublished");
    }
    
    dispose () {

        function disposeElement(element) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }

        for (var element of this.elements) {
            disposeElement(element);
        }

        for (var videoElement of this.videoElements) {
            disposeElement(videoElement.video);
        }
        
        if (this.wp) {
            this.wp.dispose();
        } else { 
            if (this.wrStream) {
                this.wrStream.getAudioTracks().forEach((track) => {
	                track.stop && track.stop()
	            })
                this.wrStream.getVideoTracks().forEach((track) => {
	                track.stop && track.stop()
	            })
        	}
        }

        console.log(this.getGlobalID() + ": Stream '" + this.id + "' disposed");
    }
}

// KurentoRoom --------------------------------

declare var RpcBuilder: any;
export class KurentoRoom{
    private room: any;
    private userName: string;
    private jsonRpcClient:any;
    private rpcParams:any;

    constructor(private wsUri:any, private callback:any){
        if (!(this instanceof KurentoRoom))
            return new KurentoRoom(wsUri, callback);
        this.initJsonRpcClient();
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
    
    connectCallback(error) {
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

    onParticipantJoined(params) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantJoined(params);
        }
    }

    onParticipantPublished(params) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantPublished(params);
    	    }
   	}

    onParticipantLeft(params) {
   	    if (this.isRoomAvailable()) {
            this.room.onParticipantLeft(params);
   	    }
    }

    onParticipantEvicted(params) {
        if (this.isRoomAvailable()) {
            this.room.onParticipantEvicted(params);
        }
    }

    onNewMessage(params) {
        if (this.isRoomAvailable()) {
            this.room.onNewMessage(params);
   	    }
    }

    iceCandidateEvent(params) {
        if (this.isRoomAvailable()) {
            this.room.recvIceCandidate(params);
          }
    }

    onRoomClosed(params) {
        if (this.isRoomAvailable()) {
            this.room.onRoomClosed(params);
        }
    }

    onMediaError(params) {
        if (this.isRoomAvailable()) {
            this.room.onMediaError(params);
        }
      }

    setRpcParams (params) {
        this.rpcParams = params;
    }

    sendRequest (method, params, callback) {
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

    close (forced) {
        if (this.isRoomAvailable()) {
            this.room.leave(forced, this.jsonRpcClient);
    	    }
    };

    disconnectParticipant (stream) {
        if (this.isRoomAvailable()) {
            this.room.disconnect(stream);
    	}
	}
    
    Stream (room, options) {
        options.participant = room.getLocalParticipant();
        return new Stream(this, true, room, options);
    };

    Room (options) {
        this.room = new Room(this, options);
        return this.room;
    };

    //CHAT
    sendMessage (room, user, message) {
        this.sendRequest('sendMessage', {message: message, userMessage: user, roomMessage: room}, (error, response) => {
            if (error) {
                console.error(error);
            }
        });
    };
    
    sendCustomRequest (params, callback) {
        this.sendRequest('customRequest', params, callback);
    };    

    
}
