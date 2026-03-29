import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-household-setup',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  templateUrl: './household-setup.component.html',
  styleUrl: './household-setup.component.scss',
})
export class HouseholdSetupComponent {}