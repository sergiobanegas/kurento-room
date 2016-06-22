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
	public holaa:number = 10000;
	public streams2: any[] = [];

	constructor(private kurentoRoomService:KurentoroomService, private router: Router) {
		if (this.kurentoRoomService.getRoomName()==undefined || this.kurentoRoomService.getUserName()==undefined){
			this.router.navigate(['/']);
		}else{
			this.kurentoRoomService.connect();
		}      
	}

	/*hola() {
		alert(this.streams.length);
	}*/

	leaveRoom() {
		this.kurentoRoomService.leaveRoom();
		this.router.navigate(['/']);
	}
}

