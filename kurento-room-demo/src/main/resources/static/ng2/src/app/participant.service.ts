import { Injectable } from '@angular/core';
import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Stream } from './Stream';
import { Participant } from './Participant';
import {AppParticipant} from './Participants'

declare var jQuery : any;
declare var $:any;
@Injectable()
export class ServiceParticipant {

	private mainParticipant;
    private localParticipant;
    private mirrorParticipant;
    private participants = [];
    private roomName;
    private connected = true;
    private displayingRelogin = false;
    private mainSpeaker = true;
    private room;

    constructor(){}
    
    isConnected() {
    	return this.connected;
    }
    
    getRoomName () {
        console.log("room - getRoom " + this.roomName);
        this.roomName = this.room.name;
        return this.roomName;
    };

    getMainParticipant() {
		return this.mainParticipant;
	}
    
    updateVideoStyle() {
        let MAX_WIDTH = 14;
        let numParticipants = Object.keys(this.participants).length;
        let maxParticipantsWithMaxWidth = 98 / MAX_WIDTH;

        if (numParticipants > maxParticipantsWithMaxWidth) {
            $('.video').css({
                "width": (98 / numParticipants) + "%"
            });
        } else {
            $('.video').css({
                "width": MAX_WIDTH + "%"
            });
        }
    };

    updateMainParticipant(participant:any) {
        if (this.mainParticipant) {
        	this.mainParticipant.removeMain();
        }
        this.mainParticipant = participant;
        this.mainParticipant.setMain();
    }

    addLocalParticipant (stream: any) {
        this.localParticipant = this.addParticipant(stream);
        this.mainParticipant = this.localParticipant;
        this.mainParticipant.setMain();
    };

    addLocalMirror (stream: any) {
		this.mirrorParticipant = this.addParticipant(stream);
	};
    
    addParticipant (stream: any) {

        let participant = new AppParticipant(stream);
        this.participants[stream.getGlobalID()] = participant;

        this.updateVideoStyle();

        $(participant.videoElement).click((e)=> {
            this.updateMainParticipant(participant);
        });

        //updateMainParticipant(participant);

        return participant;
    };
    
    removeParticipantByStream  (stream: any) {
        this.removeParticipant(stream.getGlobalID());
    };

    disconnectParticipant (appParticipant: any) {
    	this.removeParticipant(appParticipant.getStream().getGlobalID());
    };

    removeParticipant (streamId: any) {
    	let participant = this.participants[streamId];
        delete this.participants[streamId];
        participant.remove();
        
        if (this.mirrorParticipant) {
        	let otherLocal = null;
        	if (participant === this.localParticipant) {
        		otherLocal = this.mirrorParticipant;
        	}
        	if (participant === this.mirrorParticipant) {
        		otherLocal = this.localParticipant;
        	}
        	if (otherLocal) {
        		console.log("Removed local participant (or mirror) so removing the other local as well");
        		delete this.participants[otherLocal.getStream().getGlobalID()];
        		otherLocal.remove();
        	}
        }
        
        //setting main
        if (this.mainParticipant && this.mainParticipant === participant) {
        	let mainIsLocal = false;
        	if (this.localParticipant) {
        		if (participant !== this.localParticipant && participant !== this.mirrorParticipant) {
        			this.mainParticipant = this.localParticipant;
        			mainIsLocal = true;
        		} else {
        			this.localParticipant = null;
                	this.mirrorParticipant = null;
        		}
        	}
        	if (!mainIsLocal) {
        		let keys = Object.keys(this.participants);
        		if (keys.length > 0) {
        			this.mainParticipant = this.participants[keys[0]];
        		} else {
        			this.mainParticipant = null;
        		}
        	}
        	if (this.mainParticipant) {
        		this.mainParticipant.setMain();
        		console.log("Main video from " + this.mainParticipant.getStream().getGlobalID());
        	} else
        		console.error("No media streams left to display");
        }

        this.updateVideoStyle();
    };

    //only called when leaving the room
    removeParticipants () {
    	this.connected = false;
        for (var participant of this.participants) {
            participant.remove();
        }
    };

    getParticipants() {
        return this.participants;
    };

    enableMainSpeaker () {
    	this.mainSpeaker = true;
    }

    disableMainSpeaker () {
    	this.mainSpeaker = false;
    }

    // Open the chat automatically when a message is received
    autoOpenChat() {
        let selectedEffect = "slide";
        let options = {direction: "right"};
        if ($("#effect").is(':hidden')) {
            $("#content").animate({width: '80%'}, 500);
            $("#effect").toggle(selectedEffect, options, 500);
        }
    };

    showMessage(room:any, user:any, message:any) {
        let ul = document.getElementsByClassName("list");

        let chatDiv = document.getElementById('chatDiv');
        let messages = $("#messages");
        let updateScroll = true;

        if (messages.outerHeight() - chatDiv.scrollTop > chatDiv.offsetHeight) {
        	updateScroll = false;
        }
        console.log(this.localParticipant)
        let localUser = this.localParticipant.thumbnailId.replace("_webcam", "").replace("video-", "");
        if (room === this.roomName && user === localUser) { //me

            let li = document.createElement('li');
            li.className = "list-row list-row--has-primary list-row--has-separator";
            let div1 = document.createElement("div1");
            div1.className = "list-secondary-tile";
            let img = document.createElement("img");
            img.className = "list-primary-tile__img";
            img.setAttribute("src", "http://ui.lumapps.com/images/placeholder/2-square.jpg");
            let div2 = document.createElement('div');
            div2.className = "list-content-tile list-content-tile--two-lines";
            let strong = document.createElement('strong');
            strong.innerHTML = user;
            let span = document.createElement('span');
            span.innerHTML = message;
            div2.appendChild(strong);
            div2.appendChild(span);
            div1.appendChild(img);
            li.appendChild(div1);
            li.appendChild(div2);
            ul[0].appendChild(li);

//               <li class="list-row list-row--has-primary list-row--has-separator">
//                        <div class="list-secondary-tile">
//                            <img class="list-primary-tile__img" src="http://ui.lumapps.com/images/placeholder/2-square.jpg">
//                        </div>
//
//                        <div class="list-content-tile list-content-tile--two-lines">
//                            <strong>User 1</strong>
//                            <span>.............................</span>
//                        </div>
//                    </li>


        } else {//others

            let li = document.createElement('li');
            li.className = "list-row list-row--has-primary list-row--has-separator";
            let div1 = document.createElement("div1");
            div1.className = "list-primary-tile";
            let img = document.createElement("img");
            img.className = "list-primary-tile__img";
            img.setAttribute("src", "http://ui.lumapps.com/images/placeholder/1-square.jpg");
            let div2 = document.createElement('div');
            div2.className = "list-content-tile list-content-tile--two-lines";
            let strong = document.createElement('strong');
            strong.innerHTML = user;
            let span = document.createElement('span');
            span.innerHTML = message;
            div2.appendChild(strong);
            div2.appendChild(span);
            div1.appendChild(img);
            li.appendChild(div1);
            li.appendChild(div2);
            ul[0].appendChild(li);
            this.autoOpenChat();

//                 <li class="list-row list-row--has-primary list-row--has-separator">
//                        <div class="list-primary-tile">
//                            <img class="list-primary-tile__img" src="http://ui.lumapps.com/images/placeholder/1-square.jpg">
//                        </div>
//
//                        <div class="list-content-tile list-content-tile--two-lines">
//                            <strong>User 2</strong>
//                            <span>.............................</span>
//                        </div>
//                    </li>
        }
        
        if (updateScroll) {
        	chatDiv.scrollTop = messages.outerHeight();
        }
    };

    showError ($window:any, LxNotificationService:any, e:any) {
        if (this.displayingRelogin) {
            console.warn('Already displaying an alert that leads to relogin');
            return false;
          }
        this.displayingRelogin = true;
        this.removeParticipants();
        LxNotificationService.alert('Error!', e.error.message, 'Reconnect', (answer: any) => {
        	this.displayingRelogin = false;
            $window.location.href = '/';
        });
    };
    
    forceClose ($window:any, LxNotificationService:any, msg:any) {
        if (this.displayingRelogin) {
            console.warn('Already displaying an alert that leads to relogin');
            return false;
          }
        this.displayingRelogin = true;
        this.removeParticipants();
        LxNotificationService.alert('Warning!', msg, 'Reload', (answer:any) => {
        	this.displayingRelogin = false;
            $window.location.href = '/';
        });
    };
    
    alertMediaError ($window: any, LxNotificationService: any, msg:any, callback: any) {
        if (this.displayingRelogin) {
            console.warn('Already displaying an alert that leads to relogin');
            return false;
          }
    	LxNotificationService.confirm('Warning!', 'Server media error: ' + msg
    			+ ". Please reconnect.", { cancel:'Disagree', ok:'Agree' }, 
    			(answer: any) => {
    	            console.log("User agrees upon media error: " + answer);
    	            if (answer) {
    	            	this.removeParticipants();
    	                $window.location.href = '/';
    	            }
    	            if (typeof callback === "function") {
    	            	callback(answer);
    	            }
    			});
	};

    streamSpeaking (participantId: any) {
    	if (this.participants[participantId.participantId] != undefined)
    		document.getElementById("speaker" + this.participants[participantId.participantId].thumbnailId).style.display='';
    }

    streamStoppedSpeaking (participantId: any) {
    	if (this.participants[participantId.participantId] != undefined)
    		document.getElementById("speaker" + this.participants[participantId.participantId].thumbnailId).style.display = "none";
    }

    updateMainSpeaker(participantId: any) {
    	if (this.participants[participantId.participantId] != undefined) {
    		if (this.mainSpeaker)
    			this.updateMainParticipant(this.participants[participantId.participantId]);
    	}
    }
}