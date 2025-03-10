import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ZakazService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getOrders(): Observable<any[]> {
    const userId = this.authService.getUserId();
    return this.http.get<any[]>(`${this.apiUrl}/zakaz?userId=${userId}`);
  }

  removeOrder(orderId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/zakaz/${orderId}`);
  }
}