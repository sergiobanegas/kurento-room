import { Injectable } from '@angular/core';
import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Stream } from './Stream';
import { Participant } from './Participant';
import {AppParticipant} from './Participants'

declare var jQuery : any;
declare var $:any;
@Injectable()
export class ServiceRoom {

	
    private kurento;
    private roomName;
    private userName;
    private localStream;

    getKurento () {
        return this.kurento;
    };

    getRoomName() {
        return this.roomName;
    };

    setKurento (value:any) {
        this.kurento = value;
    };

    setRoomName (value:any) {
        this.roomName = value;
    };

    getLocalStream () {
        return this.localStream;
    };

    setLocalStream (value:any) {
        this.localStream = value;
    };

    getUserName () {
        return this.userName;
    };

    setUserName (value:any) {
        this.userName = value;
    };
}