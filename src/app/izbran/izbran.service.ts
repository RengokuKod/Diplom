import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class IzbranService {
    private apiUrl = 'http://localhost:3000/api/izbran';

    constructor(private http: HttpClient) {}

    getIzbrans(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}`);
    }
}