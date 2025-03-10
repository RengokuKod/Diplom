import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Postavshik {
    id: number;
    name: string;
    rating: number;
    order_count: number;
    courier_count: number;
    founded_year: number;
    phone: string;
    photo?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PostavshikService {
    private apiUrl = 'http://localhost:3000/api/postavshik';

    constructor(private http: HttpClient) {}

    getPostavshiks(): Observable<Postavshik[]> {
        return this.http.get<Postavshik[]>(this.apiUrl);
    }
}