import { Routes } from '@angular/router';
import { ProponentsComponent } from '../proponents.component';
import { UserDetailComponent } from '../user-detail-component/user-detail/user-detail.component';

export const routes: Routes = [
  { path: '', component: ProponentsComponent },
  { path: 'user/:id', component: UserDetailComponent }
];
