import { Component } from '@angular/core';
import { KurentoRoom } from '../KurentoRoom';
import { Room } from '../Room';
import { Stream } from '../Stream';
import { KurentoroomService } from '../kurentoroom.service';
import {ROUTER_DIRECTIVES, Router} from "@angular/router";

@Component({
  moduleId: module.id,
  selector: 'index',
  templateUrl: 'index.component.html',
  styleUrls: ['index.component.css']
})

export class IndexComponent {
        
	constructor(private kurentoRoomService: KurentoroomService, private router: Router) { }

	register(userId: string, roomId: string) {
		this.kurentoRoomService.configureService(userId, roomId);
		this.router.navigate(['/call']);
	}
}

