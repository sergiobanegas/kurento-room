import { Injectable } from '@angular/core';
import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Stream } from './Stream';
import { Participant } from './Participant';
import { AppParticipant } from './AppParticipant'

declare var jQuery : any;
declare var $:any;

@Injectable()
export class ServiceRoom {

	
    private kurento:KurentoRoom;
    private roomName:string;
    private userName:string;
    private localStream:any;

    getKurento () {
        return this.kurento;
    };

    getRoomName() {
        return this.roomName;
    };

    setKurento (value:any) {
        this.kurento = value;
    };

    setRoomName (value:string) {
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

    setUserName (value:string) {
        this.userName = value;
    };
}