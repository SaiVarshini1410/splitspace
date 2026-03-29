import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { HouseholdService, Household } from '../../services/household.service';
import { ChoreService, ChoreAssignment } from '../../services/chore.service';

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
  assignments: ChoreAssignment[] = [];
  myIncompleteCount: number = 0;
  inviteCopied: boolean = false;

  constructor(
    private authService: AuthService,
    private householdService: HouseholdService,
    private choreService: ChoreService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();

    this.householdService.getMine().subscribe({
      next: (response) => {
        this.household = response.household;
      },
    });

    this.choreService.generate().subscribe({
      next: () => this.loadAssignments(),
      error: () => this.loadAssignments(),
    });
  }

  loadAssignments(): void {
    this.choreService.getToday().subscribe({
      next: (response) => {
        this.assignments = response.assignments;
        this.myIncompleteCount = this.assignments.filter(
          (a) => a.assigned_to === this.user?.id && !a.completed_at
        ).length;
      },
    });
  }

  onComplete(assignmentId: number): void {
    this.choreService.complete(assignmentId).subscribe({
      next: () => {
        const assignment = this.assignments.find((a) => a.id === assignmentId);
        if (assignment) {
          assignment.completed_at = new Date().toISOString();
          this.myIncompleteCount = this.assignments.filter(
            (a) => a.assigned_to === this.user?.id && !a.completed_at
          ).length;
        }
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
      this.inviteCopied = true;
      setTimeout(() => {
        this.inviteCopied = false;
      }, 2000);
    }
  }
}