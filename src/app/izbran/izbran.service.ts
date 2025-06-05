import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IzbranService {
  private apiUrl = 'http://localhost:3000/api/izbran';
  public izbranChange: Subject<number | null> = new Subject<number | null>(); // Исправлено на number | null

  constructor(private http: HttpClient) {}

  getIzbrans(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}`);
  }

  addToIzbran(userId: string, productId: number): Observable<any> {
    return this.http.post<{ success: boolean }>(this.apiUrl, { userId, productId }).pipe(
      tap(() => {
        this.izbranChange.next(productId); // Уведомление об изменении
      })
    );
  }

  removeFromIzbran(productId: number, userId: string): Observable<any> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${productId}?userId=${userId}`).pipe(
      tap(() => {
        this.izbranChange.next(productId); // Уведомление об изменении
      })
    );
  }
}