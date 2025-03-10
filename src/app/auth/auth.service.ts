import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private tokenKey = 'auth-token';
  private usernameKey = 'username';
  private userIdKey = 'user-id'; // Новый ключ для хранения ID пользователя
  private userRoleKey = 'роль';

  constructor(private http: HttpClient) {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  register(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user).pipe(
      tap(response => {
        console.log('User registered:', response);
      })
    );
  }

  login(имя_пользователя: string, пароль: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { имя_пользователя, пароль }).pipe(
      tap(response => {
        console.log('Response from login:', response);
        if (this.isBrowser()) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.usernameKey, имя_пользователя);
          localStorage.setItem(this.userIdKey, response.userId); // Сохраняем ID пользователя
          localStorage.setItem(this.userRoleKey, response.роль);
        }
      })
    );
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.usernameKey);
      localStorage.removeItem(this.userIdKey); // Удаляем ID пользователя
      localStorage.removeItem(this.userRoleKey);
    }
  }

  isAuthenticated(): boolean {
    if (this.isBrowser()) {
      return !!localStorage.getItem(this.tokenKey);
    }
    return false;
  }

  getUsername(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(this.usernameKey);
    }
    return null;
  }

  getUserRole(): string | null {
    if (this.isBrowser()) {
        return localStorage.getItem(this.userRoleKey);
    }
    return null; // Возврат null, если не в браузере
  }

  getUserId(): string | null { // Новый метод для получения ID пользователя
    if (this.isBrowser()) {
      return localStorage.getItem(this.userIdKey);
    }
    return null;
  }

  seedDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seed`, {}).pipe(
      tap(response => {
        console.log('Database successfully seeded:', response);
      })
    );
  }
  migrateDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/migrate`, {}).pipe(
      tap(response => {
        console.log('Database successfully migrated:', response);
      })
    );
  }
}