import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/users'; // Укажите URL вашего API

  constructor(private http: HttpClient) { }

  register(user: User): Observable<User> {
    return this.http.post<User>(${this.apiUrl}/register, user);
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(${this.apiUrl}/login, { username, password });
  }
}