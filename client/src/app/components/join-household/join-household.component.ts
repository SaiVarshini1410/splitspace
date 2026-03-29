import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HouseholdService } from '../../services/household.service';

@Component({
  selector: 'app-join-household',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './join-household.component.html',
  styleUrl: './join-household.component.scss',
})
export class JoinHouseholdComponent {
  joinForm = new FormGroup({
    inviteCode: new FormControl('', [Validators.required]),
  });

  errorMessage: string = '';

  constructor(
    private householdService: HouseholdService,
    private router: Router
  ) {}

  onJoin(): void {
    if (this.joinForm.valid) {
      const { inviteCode } = this.joinForm.value;

      this.householdService.join(inviteCode!).subscribe({
        next: (response) => {
          console.log('Joined household:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Failed to join household.';
        },
      });
    }
  }
}