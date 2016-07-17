import { Component } from '@angular/core';
import { DomSanitizationService } from '@angular/platform-browser';
import { KurentoRoom } from '../KurentoRoom'
import { Room } from '../Room'
import { Stream } from '../Stream'
import { ServiceRoom } from '../room.service'
import { ServiceParticipant } from '../participant.service'
import { KurentoroomService } from '../kurentoroom.service'
import { ROUTER_DIRECTIVES, Router } from "@angular/router";

declare var jQuery: any;
declare var $:any;
@Component({
	moduleId: module.id,
	selector: 'call',
	templateUrl: 'call.component.html',
	styleUrls: ['call.component.css']
})

export class CallComponent {

    private roomName:string = this.kurentoroomService.getRoomName();
    private userName:string = this.kurentoroomService.getUserName();
    private participants:any[] = this.serviceParticipant.getParticipants();
    private kurento:KurentoRoom = this.serviceRoom.getKurento();
    private message:any;

    constructor(private router: Router, private sanitizer: DomSanitizationService, private kurentoroomService: KurentoroomService, private serviceRoom: ServiceRoom, private serviceParticipant: ServiceParticipant) {
        if (this.kurentoroomService.getRoomName()==undefined){
            this.router.navigate(['/']);
        }else{
            this.kurentoroomService.connect();
        }      
    }

    leaveRoom () {
        this.serviceRoom.getKurento().close();
        this.serviceParticipant.removeParticipants();
        this.router.navigate(["/index"]);
    };

    /*window.onbeforeunload = function () {
    	//not necessary if not connected
    	if (this.serviceParticipant.isConnected()) {
    		this.serviceRoom.getKurento().close();
    	}
    };*/


    goFullscreen  () {

        /*if (Fullscreen.isEnabled())
            Fullscreen.cancel();
        else
            Fullscreen.all();*/
    };
    
    disableMainSpeaker (value) {
    	let element = document.getElementById("buttonMainSpeaker");
        if (element.classList.contains("md-person")) { //on
            element.classList.remove("md-person");
            element.classList.add("md-recent-actors");
            this.serviceParticipant.enableMainSpeaker();
        } else { //off
            element.classList.remove("md-recent-actors");
            element.classList.add("md-person");
            this.serviceParticipant.disableMainSpeaker();
        }
    }

    onOffVolume () {
        let localStream =  this.serviceRoom.getLocalStream();
        let element = document.getElementById("buttonVolume");
        if (element.classList.contains("md-volume-off")) { //on
            element.classList.remove("md-volume-off");
            element.classList.add("md-volume-up");
            localStream.audioEnabled = true;
        } else { //off
            element.classList.remove("md-volume-up");
            element.classList.add("md-volume-off");
            localStream.audioEnabled = false;
        }
    };

    onOffVideocam  () {
        let localStream =  this.serviceRoom.getLocalStream();
        let element = document.getElementById("buttonVideocam");
        if (element.classList.contains("md-videocam-off")) {//on
            element.classList.remove("md-videocam-off");
            element.classList.add("md-videocam");
            localStream.videoEnabled = true;
        } else {//off
            element.classList.remove("md-videocam");
            element.classList.add("md-videocam-off");
            localStream.videoEnabled = false;
        }
    };

    disconnectStream () {
    	let localStream =  this.serviceRoom.getLocalStream();
    	let participant = this.serviceParticipant.getMainParticipant();
    	if (!localStream || !participant) {
    		/*LxNotificationService.alert('Error!', "Not connected yet", 'Ok', function(answer) {
            });*/
            return false;
        }
        this.serviceParticipant.disconnectParticipant(participant);
        this.serviceRoom.getKurento().disconnectParticipant(participant.getStream());
    }
    

    sendMessage () {
        console.log("Sending message", this.message);
        let kurento = this.serviceRoom.getKurento();
        kurento.sendMessage(this.roomName, this.userName, this.message);
        this.message = "";
    };

    //open or close chat when click in chat button
    toggleChat () {
        let selectedEffect = "slide";
        // most effect types need no options passed by default
        let options = {direction: "right"};
        if ($("#effect").is(':visible')) {
            $("#content").animate({width: '100%'}, 500);
        } else {
            $("#content").animate({width: '80%'}, 500);
        }
        // run the effect
        $("#effect").toggle(selectedEffect, options, 500);
    };
    
    showHat () {
    	let targetHat = false;
    	let offImgStyle = "md-mood";
    	let offColorStyle = "btn--deep-purple";
    	let onImgStyle = "md-face-unlock";
    	let onColorStyle = "btn--purple";
    	let element = document.getElementById("hatButton");
        if (element.classList.contains(offImgStyle)) { //off
            element.classList.remove(offImgStyle);
            element.classList.remove(offColorStyle);
            element.classList.add(onImgStyle);
            element.classList.add(onColorStyle);
            targetHat = true;
        } else if (element.classList.contains(onImgStyle)) { //on
            element.classList.remove(onImgStyle);
            element.classList.remove(onColorStyle);
            element.classList.add(offImgStyle);
            element.classList.add(offColorStyle);
            targetHat = false;
        }
        
        let hatTo = targetHat ? "on" : "off";
        console.log("Toggle hat to " + hatTo);
        this.serviceRoom.getKurento().sendCustomRequest({hat: targetHat}, (error:any, response:any) => {
            if (error) {
                console.error("Unable to toggle hat " + hatTo, error);
                /*LxNotificationService.alert('Error!', "Unable to toggle hat " + hatTo, 
                'Ok', function(answer) {});*/
                return false;
            } else {
            	console.debug("Response on hat toggle", response);
            }
        });
    };
}
