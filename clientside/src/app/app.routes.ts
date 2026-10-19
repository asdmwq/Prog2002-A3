/**
 * app.routes.ts
 * Client-side routes. The LayoutComponent supplies the shared header/footer;
 * each child renders its page inside the <router-outlet>.
 */
import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { HomeComponent } from './pages/home';
import { SearchComponent } from './pages/search';
import { EventDetailComponent } from './pages/event-detail';
import { RegisterComponent } from './pages/register';
import { NotFoundComponent } from './pages/not-found';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'search', component: SearchComponent },
      { path: 'event/:id', component: EventDetailComponent },
      { path: 'register/:id', component: RegisterComponent },
      { path: '**', component: NotFoundComponent },
    ],
  },
];
