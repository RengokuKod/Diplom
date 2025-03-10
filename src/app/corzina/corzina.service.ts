import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CorzinaService {
    private apiUrl = 'http://localhost:3000/api/corzina';
    private orderUrl = 'http://localhost:3000/api/zakaz';

    constructor(private http: HttpClient) {}

    getCorzina(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}`);
    }

    updateCorzina(id: number, quantity: number, supplierId: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, { quantity, supplierId });
    }

    removeCorzina(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    createOrder(userId: string, total: number): Observable<any> {
        return this.http.post<any>(this.orderUrl, { userId, total });
    }

    addToCorzina(productId: number, quantity: number, price: number): Observable<any> {
        const userId = localStorage.getItem('userId');
        if (!userId) throw new Error('User not logged in');
        const supplierId = null; // Можно добавить логику выбора поставщика
        return this.http.post<any>(this.apiUrl, { userId, productId, quantity, price, supplierId });
    }
}