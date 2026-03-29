import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

interface HouseholdMember {
  id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface Household {
  id: number;
  name: string;
  inviteCode: string;
  role: string;
  members?: HouseholdMember[];
}

interface HouseholdResponse {
  message?: string;
  household: Household | null;
}

@Injectable({
  providedIn: 'root',
})
export class HouseholdService {
  private apiUrl = 'http://localhost:3000/api/household';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

  create(name: string): Observable<HouseholdResponse> {
    return this.http.post<HouseholdResponse>(
      `${this.apiUrl}/create`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  join(inviteCode: string): Observable<HouseholdResponse> {
    return this.http.post<HouseholdResponse>(
      `${this.apiUrl}/join`,
      { inviteCode },
      { headers: this.getHeaders() }
    );
  }

  getMine(): Observable<HouseholdResponse> {
    return this.http.get<HouseholdResponse>(
      `${this.apiUrl}/mine`,
      { headers: this.getHeaders() }
    );
  }
}