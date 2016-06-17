import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES, Router } from '@angular/router';
import { KurentoroomService } from './kurentoroom.service';

@Component({
  moduleId: module.id,
  selector: 'app-root',
  template: `
    <h1 class="title">Kurento Room Basic App</h1>
    <router-outlet></router-outlet>
  `,
  styleUrls: ['app.component.css'],
  directives: [ROUTER_DIRECTIVES],
  providers: [KurentoroomService]
})
export class AppComponent {

  constructor() {
  }
}
