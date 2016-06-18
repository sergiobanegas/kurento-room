import { Injectable } from '@angular/core';
import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Stream } from './Stream';

declare var checkColor: any;

@Injectable()
export class KurentoroomService {

	private kurento: KurentoRoom;
	private room: Room;
	private localStream: any;
	private roomName: string;
	private userName: string;

	getKurento() {
		return this.kurento;
	}

	getRoom() {
		return this.room;
	}

	getLocalStream() {
		return this.localStream;
	}

	getRoomName(){
		return this.roomName;
	}

	getUserName(){
		return this.userName;
	}

	setKurento(kurento: KurentoRoom) {
		this.kurento = kurento;
	}

	setRoom(room: Room) {
		this.room = room;
	}

	setRoomName(roomName: string){
		this.roomName = roomName;
	}

	setUserName(userName: string){
		this.userName = userName;
	}

	setLocalStream(localStream: any) {
		this.localStream = localStream;
	}

	initLocalStream() {
		this.localStream.init();
	}

	leaveRoom() {
		this.room = null;
		this.kurento.close();
	}

}
