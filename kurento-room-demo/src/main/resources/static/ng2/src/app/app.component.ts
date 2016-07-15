import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES, Router } from '@angular/router';
import { ServiceParticipant } from './participant.service';
import { KurentoroomService } from './kurentoroom.service';
import { ServiceRoom } from './room.service';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  template: `
    <h1 class="title">Kurento Room Demo</h1>
    <router-outlet></router-outlet>
  `,
  styleUrls: ['app.component.css'],
  directives: [ROUTER_DIRECTIVES],
  providers: [ServiceParticipant, KurentoroomService, ServiceRoom]
})
export class AppComponent {
  
  constructor() {
  }
  
}
