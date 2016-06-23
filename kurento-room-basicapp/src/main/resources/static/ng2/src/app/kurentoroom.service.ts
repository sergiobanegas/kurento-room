import { Injectable } from '@angular/core';
import { KurentoRoom } from './KurentoRoom';
import { Room } from './Room';
import { Stream } from './Stream';
import { Participant } from './Participant';

declare var checkColor: any;

@Injectable()
export class KurentoroomService {

	private kurento: KurentoRoom = new KurentoRoom("wss://127.0.0.1:8443/room");
	private room: Room;
	private roomName: string;
	private userName: string;
	public localStream: Stream;
	public streams: Stream[]=[];

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
				thresholdSpeaker: null
			});

			this.localStream = kurento.createStream(this.room, {
				audio: true,
				video: true,
				data: true
			});

			this.localStream.addEventListener("access-accepted", () => {

				let playVideo = (stream: Stream) => {

					let elementId = "video-" + stream.getGlobalID();
					let div = document.createElement('div');
					div.setAttribute("id", elementId);
					document.getElementById("participants").appendChild(div);
					stream.playThumbnail(elementId);

					// Check color
					/*let videoTag = document.getElementById("native-" + elementId);
					let userId = stream.getGlobalID();
					let canvas = document.createElement('CANVAS');
					checkColor(videoTag, canvas, userId);*/
				};

				this.room.addEventListener("room-connected", (roomEvent: any) => {
					this.localStream.publish();
					this.streams.push(this.localStream);
					var streams = roomEvent.streams;
					for (var stream of streams) {
						this.streams.push(stream);
						playVideo(stream);
					}

				});

				this.room.addEventListener("stream-added", (streamEvent: any) => {
					this.streams.push(streamEvent.stream);
					playVideo(streamEvent.stream);
				});

				this.room.addEventListener("stream-removed", (streamEvent: any) => {
					/*var element = document.getElementById("video-"
						+ streamEvent.stream.getGlobalID());
					if (element !== undefined) {
						element.parentNode.removeChild(element);
					}*/
					let index = this.streams.indexOf(streamEvent.stream, 0);
					if (index > -1) {
						this.streams.splice(index, 1);
					}
				});
				playVideo(this.localStream);
				
				this.room.connect();
			});
			this.localStream.init();
		});
	}


	getKurento() {
		return this.kurento;
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

	setKurento(kurento: KurentoRoom) {
		this.kurento = kurento;
	}

	setRoomName(roomName: string){
		this.roomName = roomName;
	}

	setUserName(userName: string){
		this.userName = userName;
	}


	isAvailable(){
		if (!this.kurento){
			return false;
		}else{
			return this.kurento.isRoomAvailable();
		}
		
	}

	leaveRoom() {
		/*let streams = this.room.getStreams();
		for (var stream of streams) {
			let element = document.getElementById("video-" + stream.getGlobalID());
			if (element) {
				element.parentNode.removeChild(element);
			}
		}*/
		this.streams = null;
        this.room = null;
		this.kurento.close();
	}

}
