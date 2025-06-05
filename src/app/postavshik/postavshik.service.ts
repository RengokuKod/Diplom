import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Postavshik {
    id: number;
    название: string;
    рэйтинг: number;
    количество_заказов: number;
    количество_курьеров: number;
    год_основания: number;
    телефон: string;
    фото?: string;
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