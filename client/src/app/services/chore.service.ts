import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Chore {
  id: number;
  household_id: number;
  name: string;
  difficulty: number;
  frequency: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

interface ChoreListResponse {
  chores: Chore[];
}

interface ChoreResponse {
  message: string;
  chore: Chore;
}

@Injectable({
  providedIn: 'root',
})
export class ChoreService {
  private apiUrl = 'http://localhost:3000/api/chores';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

  getAll(): Observable<ChoreListResponse> {
    return this.http.get<ChoreListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  create(name: string, difficulty: number, frequency: string): Observable<ChoreResponse> {
    return this.http.post<ChoreResponse>(
      this.apiUrl,
      { name, difficulty, frequency },
      { headers: this.getHeaders() }
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}