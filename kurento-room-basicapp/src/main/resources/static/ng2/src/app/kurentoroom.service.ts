import { Injectable } from '@angular/core';
import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Stream } from './Stream';
import { Participant } from './Participant';

declare var checkColor: any;
declare var getUserMedia: any;

@Injectable()
export class KurentoroomService {

	private kurento: KurentoRoom = new KurentoRoom("wss://127.0.0.1:8443/room");
	private room: Room;
	private roomName: string;
	private userName: string;
	public streams: Stream[]=[];

	constructor() { }

	connect(){
		this.kurento.connect((error, kurento) => {

			if (error)
				return console.log(error);

			window.onbeforeunload = function() {
				this.kurento.close();
			}

			this.room = kurento.createRoom({
				room: this.roomName,
				user: this.userName,
				subscribeToStreams: true,
				updateSpeakerInterval: null,
				thresholdSpeaker: null,
			});

			let localStream = kurento.createStream(this.room, {
				audio: true,
				video: true,
				data: true,
				recvVideo: null,
				participant: null,
				id: null,
				recvAudio: null
			});

			localStream.addEventListener("access-accepted", () => {
				this.room.addEventListener("room-connected", (roomEvent: any) => {
					localStream.publish();
					this.streams.push(localStream);
					let streams = roomEvent.streams;
					for (var stream of streams) {
						this.streams.push(stream);
					}
				});

				this.room.addEventListener("stream-added", (streamEvent: any) => {
					this.streams.push(streamEvent.stream);
				});

				this.room.addEventListener("stream-removed", (streamEvent: any) => {
					let index = this.streams.indexOf(streamEvent.stream, 0);
					if (index > -1) {
						this.streams.splice(index, 1);
					}
				});
				
				this.room.connect();
			});
			localStream.init();
		});
	}

	getRoom() {
		return this.room;
	}

	getRoomName(){
		return this.roomName;
	}

	getUserName(){
		return this.userName;
	}

	configureService(userName:string, roomName: string){
		this.userName=userName;
		this.roomName=roomName;
	}

	leaveRoom() {
		this.streams = [];
		this.kurento.close();
	}

}
