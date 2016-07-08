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
// Stream --------------------------------

/*
 * options: name: XXX data: true (Maybe this is based on webrtc) audio: true,
 * video: true, url: "file:///..." > Player screen: true > Desktop (implicit
 * video:true, audio:false) audio: true, video: true > Webcam
 *
 * stream.hasAudio(); stream.hasVideo(); stream.hasData();
 */
import {KurentoRoom} from './KurentoRoom'
import {Room} from './Room'
import {Participant} from './Participant'
import {StreamOptions, VideoOptions} from './options.model'
import {NgZone} from '@angular/core';


declare type JQuery = any;
declare var $: JQuery;
declare var kurentoUtils: any;
declare var getUserMedia: any;
declare var RTCSessionDescription: any;
declare var EventEmitter: any;

export class Stream{
    private ee = new EventEmitter();
    private sdpOffer:string;
    private wrStream:any;
    public src: string;
    private wp:any;
    private id:string;
    private video: HTMLVideoElement;
    private videoElements: VideoOptions[] = [];
    private elements: HTMLDivElement[] = [];
    private participant:Participant;
    private speechEvent:any;
    private recvVideo:any;
    private recvAudio:any;
    private showMyRemote = false;
    private localMirrored = false;

    constructor(private kurento: KurentoRoom, private local: boolean, private room: Room, private options: StreamOptions, private zone?: NgZone) {
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
            this.src=URL.createObjectURL(this.wrStream);
            this.ee.emitEvent('src-added', {
                    stream: this
                });

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

    addEventListener (eventName:string, listener:Function) {
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
        $(this.jq('progress-' + spinnerId)).hide();
    }

    playOnlyVideo (parentElement:HTMLDivElement, thumbnailId:string) {
        this.video = document.createElement('video');
        this.video.id = 'native-video-' + this.getGlobalID();
        this.video.autoplay = true;
        this.video.controls = false;
        if (this.wrStream) {
            this.video.src = URL.createObjectURL(this.wrStream);
        	$(this.jq(thumbnailId)).show();
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
            document.getElementById(parentElement.id).appendChild(this.video);
        } else {
            parentElement.appendChild(this.video);
        }
    }

    playThumbnail (thumbnailId:string) {

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

    jq(myid:string) {
        return "#" + myid.replace(/(@|:|\.|\[|\]|,)/g, "\\$1");
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
            this.zone.run(()=>{
                this.wrStream = userStream;
                this.src=URL.createObjectURL(this.wrStream);
                this.ee.emitEvent('src-added', {
                    stream: this
                });
                this.ee.emitEvent('access-accepted', null);
            });
        }, (error) => {
            console.error("Access denied", error);
            this.ee.emitEvent('access-denied', null);
        });
    }

    publishVideoCallback(error: string, sdpOfferParam: string, wp: any) {
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
    
    startVideoCallback(error: string, sdpOfferParam: string, wp: any) {
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
    
    initWebRtcPeer(sdpOfferCallback: any) {
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
                    this.wp.generateOffer(sdpOfferCallback.bind(this));
                });
        	} else {
                 this.wp = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, (error) => {
                	if(error) {
                		return console.error(error);
                	}
                    this.wp.generateOffer(sdpOfferCallback.bind(this));
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
                this.wp.generateOffer(sdpOfferCallback.bind(this));
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

    processSdpAnswer(sdpAnswer: any) {
        let answer = new RTCSessionDescription({
            type: 'answer',
            sdp: sdpAnswer,
        });
        console.log(this.getGlobalID() + ": set peer connection with recvd SDP answer", 
        		sdpAnswer);
        let participantId = this.getGlobalID();
        let pc = this.wp.peerConnection;
        pc.setRemoteDescription(answer, () => this.zone.run(() => {
            // Avoids to subscribe to your own stream remotely 
        	// except when showMyRemote is true
            if (!this.local || this.displayMyRemote()) {
                this.wrStream = pc.getRemoteStreams()[0];
                console.log("Peer remote stream", this.wrStream);
                if (this.wrStream != undefined) {
                    this.src=URL.createObjectURL(this.wrStream);
                    this.ee.emitEvent('src-added', {
                        stream: this
                    });
                    this.speechEvent = kurentoUtils.WebRtcPeer.hark(this.wrStream, { threshold: this.room.getThresholdSpeaker() });
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
                        $(this.jq(thumbnailId)).show();
                        this.hideSpinner(videoId[2]);
                    };
                }
                this.room.emitEvent('stream-subscribed', [{
                    stream: this
                    }]);
            }
        }), (error) => {
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

        function disposeElement(element:HTMLElement) {
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