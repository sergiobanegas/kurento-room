import { provideRouter, RouterConfig } from '@angular/router';

import { IndexRoutes } from './+index/index.routes';
import { CallRoutes } from './+call/call.routes';



const routes: RouterConfig = [
	...CallRoutes,
	...IndexRoutes
];

export const APP_ROUTER_PROVIDERS = [
	provideRouter(routes)
];