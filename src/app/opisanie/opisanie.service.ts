import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OpisanieService {
    private apiUrl = 'http://localhost:3000/api/opisanie';

    constructor(private http: HttpClient) {}

    getOpisanies(productId?: string): Observable<any[]> { // Поддерживает необязательный productId
        const url = productId ? `${this.apiUrl}?productId=${productId}` : this.apiUrl;
        return this.http.get<any[]>(url);
    }
}