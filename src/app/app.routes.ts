import { provideRouter } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';

export const routes = [
  { path: '', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./components/home/services/home.routes').then(m => m.routes),
      },
      {
        path: 'posts',
        loadChildren: () =>
          import('./components/posts/services/posts.routes').then(m => m.routes),
      },
      {
        path: 'proponents',
        loadChildren: () =>
          import('./components/proponents/services/proponents.routes').then(m => m.routes),
      },
      {
        path: 'search',
        loadChildren: () =>
          import('./components/search/services/search.routes').then(m => m.routes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

export const appRouterProviders = [provideRouter(routes)];
