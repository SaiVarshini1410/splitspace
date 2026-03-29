import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HouseholdService } from '../../services/household.service';

@Component({
  selector: 'app-create-household',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './create-household.component.html',
  styleUrl: './create-household.component.scss',
})
export class CreateHouseholdComponent {
  createForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
  });

  errorMessage: string = '';

  constructor(
    private householdService: HouseholdService,
    private router: Router
  ) {}

  onCreate(): void {
    if (this.createForm.valid) {
      const { name } = this.createForm.value;

      this.householdService.create(name!).subscribe({
        next: (response) => {
          console.log('Household created:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Failed to create household.';
        },
      });
    }
  }
}