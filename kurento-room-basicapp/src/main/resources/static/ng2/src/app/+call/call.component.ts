import { Component } from '@angular/core';
import { KurentoRoom } from '../KurentoRoom'
import { Room } from '../Room'
import { Stream } from '../Stream'
import { KurentoroomService } from '../kurentoroom.service'
import {ROUTER_DIRECTIVES, Router} from "@angular/router";

declare var checkColor: any;

@Component({
	moduleId: module.id,
	selector: 'call',
	templateUrl: 'call.component.html',
	styleUrls: ['call.component.css']
})

export class CallComponent {
        
	public room = this.kurentoRoomService.getRoomName();

	constructor(private kurentoRoomService:KurentoroomService, private router: Router) {
		this.kurentoRoomService.connect();        
	}

	leaveRoom() {
		this.kurentoRoomService.leaveRoom();
		this.router.navigate(['/']);
	}
}

