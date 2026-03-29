import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CreateHouseholdComponent } from './components/create-household/create-household.component';
import { JoinHouseholdComponent } from './components/join-household/join-household.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create-household', component: CreateHouseholdComponent },
  { path: 'join-household', component: JoinHouseholdComponent },
];