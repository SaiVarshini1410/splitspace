import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Expense {
  id: number;
  household_id: number;
  paid_by: number;
  paid_by_name: string;
  amount: number;
  description: string;
  category: string;
  split_type: string;
  date: string;
  created_at: string;
}

export interface DebtItem {
  userId: number;
  name: string;
  amount: number;
}

interface ExpenseListResponse {
  expenses: Expense[];
}

interface ExpenseResponse {
  message: string;
  expense: Expense;
}

interface MyDebtsResponse {
  iOwe: DebtItem[];
  owedToMe: DebtItem[];
  totalSpend: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private apiUrl = 'http://localhost:3000/api/expenses';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

  getAll(): Observable<ExpenseListResponse> {
    return this.http.get<ExpenseListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  create(data: {
    amount: number;
    description: string;
    category: string;
    split_type: string;
    date: string;
  }): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(this.apiUrl, data, {
      headers: this.getHeaders(),
    });
  }

  getMyDebts(): Observable<MyDebtsResponse> {
    return this.http.get<MyDebtsResponse>(`${this.apiUrl}/my-debts`, {
      headers: this.getHeaders(),
    });
  }

  settle(withUserId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/settle`,
      { withUserId },
      { headers: this.getHeaders() }
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}