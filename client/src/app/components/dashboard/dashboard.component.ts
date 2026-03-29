import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { HouseholdService, Household } from '../../services/household.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  user: any = null;
  household: Household | null = null;

  constructor(
    private authService: AuthService,
    private householdService: HouseholdService
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

  copyInviteCode(): void {
    if (this.household?.inviteCode) {
      navigator.clipboard.writeText(this.household.inviteCode);
    }
  }
}