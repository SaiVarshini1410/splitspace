import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ChoreService, Chore, ChoreAssignment } from '../../services/chore.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chores',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './chores.component.html',
  styleUrl: './chores.component.scss',
})
export class ChoresComponent implements OnInit {
  chores: Chore[] = [];
  assignments: ChoreAssignment[] = [];
  showForm: boolean = false;
  errorMessage: string = '';
  currentUserId: number = 0;

  choreForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    difficulty: new FormControl(1, [Validators.required]),
    frequency: new FormControl('weekly', [Validators.required]),
  });

  difficultyOptions = [
    { value: 1, label: 'Easy (1)' },
    { value: 2, label: 'Light (2)' },
    { value: 3, label: 'Medium (3)' },
    { value: 4, label: 'Hard (4)' },
    { value: 5, label: 'Brutal (5)' },
  ];

  frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
  ];

  constructor(
    private choreService: ChoreService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.currentUserId = user?.id || 0;
    this.loadChores();
    this.generateAndLoadAssignments();
  }

  loadChores(): void {
    this.choreService.getAll().subscribe({
      next: (response) => {
        this.chores = response.chores;
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to load chores.';
      },
    });
  }

  generateAndLoadAssignments(): void {
    // First generate any needed assignments, then fetch today's
    this.choreService.generate().subscribe({
      next: () => {
        this.loadAssignments();
      },
      error: () => {
        // Even if generate fails, try loading existing assignments
        this.loadAssignments();
      },
    });
  }

  loadAssignments(): void {
    this.choreService.getToday().subscribe({
      next: (response) => {
        this.assignments = response.assignments;
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  onCreate(): void {
    if (this.choreForm.valid) {
      const { name, difficulty, frequency } = this.choreForm.value;

      this.choreService.create(name!, difficulty!, frequency!).subscribe({
        next: (response) => {
          this.chores.unshift(response.chore);
          this.choreForm.reset({ name: '', difficulty: 1, frequency: 'weekly' });
          this.showForm = false;
          // Regenerate assignments so the new chore gets assigned
          this.generateAndLoadAssignments();
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Failed to create chore.';
        },
      });
    }
  }

  onDelete(choreId: number): void {
    this.choreService.delete(choreId).subscribe({
      next: () => {
        this.chores = this.chores.filter((c) => c.id !== choreId);
        this.assignments = this.assignments.filter((a) => a.chore_id !== choreId);
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to delete chore.';
      },
    });
  }

  onComplete(assignmentId: number): void {
    this.choreService.complete(assignmentId).subscribe({
      next: () => {
        const assignment = this.assignments.find((a) => a.id === assignmentId);
        if (assignment) {
          assignment.completed_at = new Date().toISOString();
        }
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to complete chore.';
      },
    });
  }

  getDifficultyLabel(value: number): string {
    return this.difficultyOptions.find((d) => d.value === value)?.label || '';
  }
}