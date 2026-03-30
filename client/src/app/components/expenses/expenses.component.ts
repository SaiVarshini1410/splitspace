import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ExpenseService, Expense, DebtItem } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  iOwe: DebtItem[] = [];
  owedToMe: DebtItem[] = [];
  totalSpend: number = 0;
  showForm: boolean = false;
  errorMessage: string = '';
  currentUserId: number = 0;

  expenseForm = new FormGroup({
    description: new FormControl('', [Validators.required]),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    category: new FormControl('other', [Validators.required]),
    date: new FormControl(new Date().toISOString().split('T')[0], [Validators.required]),
  });

  categoryOptions = [
    { value: 'rent', label: 'Rent', icon: 'home' },
    { value: 'utilities', label: 'Utilities', icon: 'bolt' },
    { value: 'groceries', label: 'Groceries', icon: 'shopping_cart' },
    { value: 'supplies', label: 'Supplies', icon: 'cleaning_services' },
    { value: 'food', label: 'Food & Dining', icon: 'restaurant' },
    { value: 'transport', label: 'Transport', icon: 'directions_car' },
    { value: 'entertainment', label: 'Entertainment', icon: 'movie' },
    { value: 'other', label: 'Other', icon: 'receipt' },
  ];

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.currentUserId = user?.id || 0;
    this.loadExpenses();
    this.loadDebts();
  }

  loadExpenses(): void {
    this.expenseService.getAll().subscribe({
      next: (response) => {
        this.expenses = response.expenses;
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to load expenses.';
      },
    });
  }

  loadDebts(): void {
    this.expenseService.getMyDebts().subscribe({
      next: (response) => {
        this.iOwe = response.iOwe;
        this.owedToMe = response.owedToMe;
        this.totalSpend = response.totalSpend;
      },
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  onCreate(): void {
    if (this.expenseForm.valid) {
      const { description, amount, category, date } = this.expenseForm.value;

      this.expenseService.create({
        description: description!,
        amount: amount!,
        category: category!,
        split_type: 'equal',
        date: date!,
      }).subscribe({
        next: (response) => {
          this.expenses.unshift(response.expense);
          this.expenseForm.reset({
            description: '',
            amount: null,
            category: 'other',
            date: new Date().toISOString().split('T')[0],
          });
          this.showForm = false;
          this.loadDebts();
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Failed to create expense.';
        },
      });
    }
  }

  onSettle(withUserId: number): void {
    this.expenseService.settle(withUserId).subscribe({
      next: () => {
        this.loadDebts();
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to settle debt.';
      },
    });
  }

  onDelete(expenseId: number): void {
    this.expenseService.delete(expenseId).subscribe({
      next: () => {
        this.expenses = this.expenses.filter((e) => e.id !== expenseId);
        this.loadDebts();
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Failed to delete expense.';
      },
    });
  }

  getCategoryIcon(category: string): string {
    return this.categoryOptions.find((c) => c.value === category)?.icon || 'receipt';
  }

  getCategoryLabel(category: string): string {
    return this.categoryOptions.find((c) => c.value === category)?.label || 'Other';
  }
}