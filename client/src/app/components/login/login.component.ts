import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { HouseholdService } from '../../services/household.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private householdService: HouseholdService,
    private router: Router
  ) {}

  onLogin(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.authService.login(email!, password!).subscribe({
        next: () => {
          // Check if user has a household
          this.householdService.getMine().subscribe({
            next: (response) => {
              if (response.household) {
                this.router.navigate(['/dashboard']);
              } else {
                this.router.navigate(['/household-setup']);
              }
            },
            error: () => {
              this.router.navigate(['/household-setup']);
            },
          });
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Login failed. Try again.';
        },
      });
    }
  }
}