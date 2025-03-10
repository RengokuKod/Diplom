import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OtzivService {
    private apiUrl = 'http://localhost:3000/api/otzivs';

    constructor(private http: HttpClient) {}

    getOtzivs(productId?: string): Observable<any[]> {
        const url = productId ? `${this.apiUrl}?productId=${productId}` : this.apiUrl;
        return this.http.get<any[]>(url);
    }
}