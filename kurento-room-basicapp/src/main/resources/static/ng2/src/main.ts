import { bootstrap } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppComponent, environment } from './app/';
import { APP_ROUTER_PROVIDERS } from './app/app.routes';
import { KurentoroomService } from './app/kurentoroom.service';

if (environment.production) {
  enableProdMode();
}

bootstrap(AppComponent, [
	APP_ROUTER_PROVIDERS, KurentoroomService
])
	.catch(err => console.error(err));
