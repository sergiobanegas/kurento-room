import { Component, NgZone } from '@angular/core';
import {DomSanitizationService} from '@angular/platform-browser';
import { KurentoRoom } from '../KurentoRoom'
import { Room } from '../Room'
import { Stream } from '../Stream'
import { KurentoroomService } from '../kurentoroom.service'
import {ROUTER_DIRECTIVES, Router} from "@angular/router";
import {RoomStreamComponent} from './roomstream.component';


@Component({
	moduleId: module.id,
	selector: 'call',
	templateUrl: 'call.component.html',
	styleUrls: ['call.component.css'],
	directives: [RoomStreamComponent]
})

export class CallComponent {
        
	public name = 'ROOM "'+this.kurentoRoomService.getRoomName()+'"';

	public streams: Stream[] = this.kurentoRoomService.streams;

	constructor(private kurentoRoomService:KurentoroomService, private router: Router, private zone: NgZone, private  sanitizer: DomSanitizationService) {
		if (this.kurentoRoomService.getRoomName()==undefined || this.kurentoRoomService.getUserName()==undefined){
			this.router.navigate(['/']);
		}else{
			this.kurentoRoomService.connect(this.zone);
		}      
	}

	leaveRoom() {
		this.kurentoRoomService.leaveRoom();
		this.router.navigate(['/']);
	}

	getStreamSrc(stream: Stream) {
		if (stream.src != undefined){
				return this.sanitizer.bypassSecurityTrustUrl(stream.src);
		}
	}
}

