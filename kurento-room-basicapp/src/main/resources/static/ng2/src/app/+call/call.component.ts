import { Component } from '@angular/core';
import { KurentoRoom } from '../KurentoRoom'
import { Room } from '../Room'
import { Stream } from '../Stream'
import { KurentoroomService } from '../kurentoroom.service'
import {ROUTER_DIRECTIVES, Router} from "@angular/router";

@Component({
	moduleId: module.id,
	selector: 'call',
	templateUrl: 'call.component.html',
	styleUrls: ['call.component.css']
})

export class CallComponent {
        
	public name = 'ROOM "'+this.kurentoRoomService.getRoomName()+'"';

	public streams: any[]=this.kurentoRoomService.streams;

	constructor(private kurentoRoomService:KurentoroomService, private router: Router) {
		if (this.kurentoRoomService.getRoomName()==undefined || this.kurentoRoomService.getUserName()==undefined){
			this.router.navigate(['/']);
		}else{
			this.kurentoRoomService.connect();
		}      
	}

	leaveRoom() {
		this.kurentoRoomService.leaveRoom();
		this.router.navigate(['/']);
	}

	getStreamSrc(stream: Stream) {
		return URL.createObjectURL(stream.getWrStream());
	}
}

