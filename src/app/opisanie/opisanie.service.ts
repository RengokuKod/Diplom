import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpisanieService {
  private apiUrl = 'http://localhost:3000/api/opisanie';

  constructor(private http: HttpClient) {}

  getOpisanie(productId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?productId=${productId}`);
  }
}