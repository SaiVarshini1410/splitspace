import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RuleService, HouseRule } from '../../services/rule.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-house-rules',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './house-rules.component.html',
  styleUrl: './house-rules.component.scss',
})
export class HouseRulesComponent implements OnInit {
  rules: HouseRule[] = [];
  totalMembers: number = 0;
  showForm: boolean = false;
  editingRuleId: number | null = null;
  errorMessage: string = '';
  currentUserId: number = 0;

  ruleForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
  });

  constructor(
    private ruleService: RuleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.currentUserId = user?.id || 0;
    this.loadRules();
  }

  loadRules(): void {
    this.ruleService.getAll().subscribe({
      next: (response) => {
        this.rules = response.rules;
        this.totalMembers = response.totalMembers;
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to load rules.';
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.editingRuleId = null;
    this.ruleForm.reset({ title: '', description: '' });
  }

  startEdit(rule: HouseRule): void {
    this.editingRuleId = rule.id;
    this.showForm = true;
    this.ruleForm.setValue({
      title: rule.title,
      description: rule.description,
    });
  }

  onSubmit(): void {
    if (this.ruleForm.valid) {
      const { title, description } = this.ruleForm.value;

      if (this.editingRuleId) {
        this.ruleService.update(this.editingRuleId, title!, description!).subscribe({
          next: (response) => {
            const index = this.rules.findIndex((r) => r.id === this.editingRuleId);
            if (index !== -1) {
              this.rules[index] = response.rule;
            }
            this.showForm = false;
            this.editingRuleId = null;
            this.ruleForm.reset({ title: '', description: '' });
          },
          error: (error) => {
            this.errorMessage = error.error.message || 'Failed to update rule.';
          },
        });
      } else {
        this.ruleService.create(title!, description!).subscribe({
          next: (response) => {
            this.rules.unshift(response.rule);
            this.showForm = false;
            this.ruleForm.reset({ title: '', description: '' });
          },
          error: (error) => {
            this.errorMessage = error.error.message || 'Failed to create rule.';
          },
        });
      }
    }
  }

  onAgree(ruleId: number): void {
    this.ruleService.agree(ruleId).subscribe({
      next: (response) => {
        const rule = this.rules.find((r) => r.id === ruleId);
        if (rule) {
          rule.agreements = response.agreements;
        }
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to agree to rule.';
      },
    });
  }

  onDelete(ruleId: number): void {
    this.ruleService.delete(ruleId).subscribe({
      next: () => {
        this.rules = this.rules.filter((r) => r.id !== ruleId);
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to delete rule.';
      },
    });
  }

  hasAgreed(rule: HouseRule): boolean {
    return rule.agreements.some((a) => a.user_id === this.currentUserId);
  }

  getAgreedCount(rule: HouseRule): number {
    return rule.agreements.length;
  }
}