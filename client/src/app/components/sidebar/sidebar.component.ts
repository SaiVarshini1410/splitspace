import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { HouseholdService, Household } from '../../services/household.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  user: any = null;
  household: Household | null = null;

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Chores', icon: 'task_alt', route: '/chores' },
    { label: 'Expenses', icon: 'account_balance_wallet', route: '/expenses' },
    { label: 'Inventory', icon: 'inventory_2', route: '/inventory' },
    { label: 'House rules', icon: 'gavel', route: '/house-rules' },
  ];

  constructor(
    private authService: AuthService,
    private householdService: HouseholdService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.householdService.getMine().subscribe({
      next: (response) => {
        this.household = response.household;
      },
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}