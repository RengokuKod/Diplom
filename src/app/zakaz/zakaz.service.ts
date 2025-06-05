import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ZakazService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getOrders(): Observable<any[]> {
    const userId = this.authService.getUserId();
    if (!userId) {
      return throwError(() => new Error('Пользователь не авторизован'));
    }
    return this.http.get<any[]>(`${this.apiUrl}/zakaz?userId=${userId}`).pipe(
      catchError((error) => {
        const message = error.error?.message || error.message || 'Неизвестная ошибка';
        console.error('Ошибка при получении заказов:', error);
        return throwError(() => new Error(`Не удалось загрузить заказы: ${message}`));
      })
    );
  }

  removeOrder(orderId: number): Observable<{ success: boolean }> {
    const userId = this.authService.getUserId();
    if (!userId) {
      return throwError(() => new Error('Пользователь не авторизован'));
    }
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/zakaz/${orderId}?userId=${userId}`).pipe(
      catchError((error) => {
        const message = error.error?.message || error.message || 'Неизвестная ошибка';
        console.error('Ошибка при удалении заказа:', error);
        return throwError(() => new Error(`Не удалось удалить заказ: ${message}`));
      })
    );
  }
}