import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface InventoryItem {
  id: number;
  household_id: number;
  name: string;
  category: string;
  status: string;
  last_updated_by: number;
  updated_by_name: string;
  updated_at: string;
  created_at: string;
}

interface ItemListResponse {
  items: InventoryItem[];
}

interface ItemResponse {
  message: string;
  item: InventoryItem;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = 'http://localhost:3000/api/inventory';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });
  }

  getAll(): Observable<ItemListResponse> {
    return this.http.get<ItemListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  create(name: string, category: string): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(
      this.apiUrl,
      { name, category },
      { headers: this.getHeaders() }
    );
  }

  updateStatus(id: number, status: string): Observable<ItemResponse> {
    return this.http.patch<ItemResponse>(
      `${this.apiUrl}/${id}/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getLowCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/low-count`, {
      headers: this.getHeaders(),
    });
  }
}