import { Component } from '@angular/core';
import { KurentoRoom } from './KurentoRoom'
import { Room } from './Room'
import { Stream } from './Stream'

declare var checkColor: any;
declare var RpcBuilder: any;

@Component({
  moduleId: module.id,
  selector: 'kurento-room-basicapp-app',
  templateUrl: 'kurento-room-basicapp.component.html',
  styleUrls: ['kurento-room-basicapp.component.css']
})

export class KurentoRoomBasicappAppComponent {
        
	private kurento: KurentoRoom;
	private room: Room;

	register(userId: string, roomId: string) {
		
		let wsUri = 'wss://127.0.0.1:8443/room';
		
        this.kurento = new KurentoRoom(wsUri);        
        this.kurento.connect((error, kurento) => {

			if (error)
				return console.log(error);
			
            window.onbeforeunload = function() {
				this.kurento.close();
			}
            
			this.room = kurento.createRoom({
				room: roomId,
				user: userId,
				subscribeToStreams: true
			});

			let localStream = kurento.createStream(this.room, {
				audio: true,
				video: true,
				data: true
			});

			localStream.addEventListener("access-accepted", () => {
				
                let playVideo = (stream: Stream) => {
				
                    let elementId = "video-" + stream.getGlobalID();
					let div = document.createElement('div');
					div.setAttribute("id", elementId);
					document.getElementById("participants").appendChild(div);
					stream.playThumbnail(elementId);

					// Check color
					let videoTag = document.getElementById("native-" + elementId);
					let userId = stream.getGlobalID();
					let canvas = document.createElement('CANVAS');
					checkColor(videoTag, canvas, userId);
				};

				this.room.addEventListener("room-connected", (roomEvent: any) => {
					
                    document.getElementById('room-header').innerText = 'ROOM \"'
						+ this.room.getName() + '\"';
					document.getElementById('join').style.display = 'none';
					document.getElementById('room').style.display = 'block';

					localStream.publish();

					var streams = roomEvent.streams;
					for (var stream of streams) {
						playVideo(stream);
					}

				});

				this.room.addEventListener("stream-added", (streamEvent: any) => {
					playVideo(streamEvent.stream);
				});

				this.room.addEventListener("stream-removed", (streamEvent: any) => {
					var element = document.getElementById("video-"
						+ streamEvent.stream.getGlobalID());
					if (element !== undefined) {
						element.parentNode.removeChild(element);
					}
				});

				playVideo(localStream);

				this.room.connect();
			});
			localStream.init();
		});
	}

	leaveRoom() {
        
		document.getElementById('join').style.display = 'block';
		document.getElementById('room').style.display = 'none';

		let streams = this.room.getStreams();
		for (var stream of streams) {
			let element = document.getElementById("video-" + stream.getGlobalID());
			if (element) {
				element.parentNode.removeChild(element);
			}
		}
        
		this.kurento.close();
	}
}

