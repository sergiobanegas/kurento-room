import { provideRouter, RouterConfig } from '@angular/router';

import { IndexRoutes } from './+index/index.routes';
import { IndexComponent } from './+index/index.component';
import { CallComponent } from './+call/call.component';

export const routes: RouterConfig = [
	{ path: '', redirectTo: '/index', terminal: true },
	{ path: 'index', component: IndexComponent },
	{ path: 'call',	component: CallComponent}
];

export const APP_ROUTER_PROVIDERS = [
	provideRouter(routes)
];