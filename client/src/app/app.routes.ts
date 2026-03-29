import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HouseholdSetupComponent } from './components/household-setup/household-setup.component';
import { CreateHouseholdComponent } from './components/create-household/create-household.component';
import { JoinHouseholdComponent } from './components/join-household/join-household.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'household-setup', component: HouseholdSetupComponent, canActivate: [authGuard] },
  { path: 'create-household', component: CreateHouseholdComponent, canActivate: [authGuard] },
  { path: 'join-household', component: JoinHouseholdComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
];