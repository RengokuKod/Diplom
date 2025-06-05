import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CorzinaService {
  private apiUrl = 'http://localhost:3000/api/corzina';
  private orderUrl = 'http://localhost:3000/api/zakaz';
  public corzinaChange: Subject<number | null> = new Subject<number | null>();

  // Предопределённые варианты адресов доставки
  private deliveryAddresses: string[] = [
    'г. Москва, ул. Ленина, д. 10, кв. 5',
    'г. Санкт-Петербург, пр. Невский, д. 25',
    'г. Новосибирск, ул. Советская, д. 15, кв. 3',
    'г. Екатеринбург, ул. Мира, д. 8',
    'г. Казань, ул. Баумана, д. 12, кв. 10'
  ];

  // Предопределённые варианты способов оплаты
  private paymentMethods: string[] = [
    'Наличные',
    'Карта',
    'Онлайн'
  ];

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Функция для выбора случайного элемента из массива
  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  getCorzina(): Observable<any[]> {
    const userId = this.authService.getUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}`).pipe(
      catchError((error) => {
        console.error('Ошибка при получении корзины:', error);
        return throwError(() => error);
      })
    );
  }

  updateCorzina(id: number, quantity: number, supplierId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { quantity, supplierId }).pipe(
      catchError((error) => {
        console.error('Ошибка при обновлении корзины:', error);
        return throwError(() => error);
      })
    );
  }

  removeCorzina(id: number): Observable<{ success: boolean; corzina: any[] }> {
    return this.http.delete<{ success: boolean; corzina: any[] }>(`${this.apiUrl}/${id}`).pipe(
      tap((response) => {
        if (response.success) {
          this.corzinaChange.next(null);
        }
      }),
      catchError((error) => {
        console.error('Ошибка при удалении товара из корзины:', error);
        return throwError(() => error);
      })
    );
  }

  createOrder(total: number, supplierId: string, items: any[]): Observable<{ success: boolean; orderId?: number; message?: string }> {
    const userId = this.authService.getUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    // Генерируем случайный адрес доставки и способ оплаты
    const delivery_address = this.getRandomItem(this.deliveryAddresses);
    const payment_method = this.getRandomItem(this.paymentMethods);
    const payload = { userId, total, supplierId, delivery_address, payment_method, items };
    console.log('Отправляемые данные для создания заказа:', payload);
    return this.http.post<{ success: boolean; orderId?: number; message?: string }>(this.orderUrl, payload).pipe(
      tap((response) => {
        console.log('Ответ сервера:', response);
        if (response.success) {
          this.corzinaChange.next(null);
        }
      }),
      catchError((error) => {
        console.error('Ошибка при создании заказа:', error);
        return throwError(() => error);
      })
    );
  }

  addToCorzina(productId: number, quantity: number, price: number): Observable<{ success: boolean; corzina: any[] }> {
    const userId = this.authService.getUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }
    const supplierId = '1'; // Default supplier ID
    return this.http.post<{ success: boolean; corzina: any[] }>(this.apiUrl, { userId, productId, quantity, price, supplierId }).pipe(
      tap((response) => {
        if (response.success) {
          this.corzinaChange.next(productId);
        }
      }),
      catchError((error) => {
        console.error('Ошибка при добавлении товара в корзину:', error);
        return throwError(() => error);
      })
    );
  }
}