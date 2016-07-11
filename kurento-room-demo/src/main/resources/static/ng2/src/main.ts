import { bootstrap } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppComponent, environment } from './app/';
import { APP_ROUTER_PROVIDERS } from './app/app.routes';
import { ServiceParticipant } from './app/participant.service';
import { ServiceRoom } from './app/room.service';
import { HTTP_PROVIDERS } from '@angular/http';


if (environment.production) {
  enableProdMode();
}

bootstrap(AppComponent, [
	APP_ROUTER_PROVIDERS, HTTP_PROVIDERS, ServiceParticipant, ServiceRoom
])
	.catch(err => console.error(err));