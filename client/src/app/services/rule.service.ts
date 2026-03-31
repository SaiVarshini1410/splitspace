import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface RuleAgreement {
  user_id: number;
  name: string;
  agreed_at: string;
}

export interface HouseRule {
  id: number;
  household_id: number;
  title: string;
  description: string;
  version: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  agreements: RuleAgreement[];
}

interface RuleListResponse {
  rules: HouseRule[];
  totalMembers: number;
}

interface RuleResponse {
  message: string;
  rule: HouseRule;
}

interface AgreeResponse {
  message: string;
  agreements: RuleAgreement[];
}

@Injectable({
  providedIn: 'root',
})
export class RuleService {
  private apiUrl = 'http://localhost:3000/api/rules';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

  getAll(): Observable<RuleListResponse> {
    return this.http.get<RuleListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  create(title: string, description: string): Observable<RuleResponse> {
    return this.http.post<RuleResponse>(
      this.apiUrl,
      { title, description },
      { headers: this.getHeaders() }
    );
  }

  agree(ruleId: number): Observable<AgreeResponse> {
    return this.http.post<AgreeResponse>(
      `${this.apiUrl}/${ruleId}/agree`,
      {},
      { headers: this.getHeaders() }
    );
  }

  update(ruleId: number, title: string, description: string): Observable<RuleResponse> {
    return this.http.put<RuleResponse>(
      `${this.apiUrl}/${ruleId}`,
      { title, description },
      { headers: this.getHeaders() }
    );
  }

  delete(ruleId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${ruleId}`, {
      headers: this.getHeaders(),
    });
  }
}