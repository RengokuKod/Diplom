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
  private userIdKey = 'user-id';
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
          localStorage.setItem(this.userIdKey, response.userId);
          localStorage.setItem(this.userRoleKey, response.роль);
        }
      })
    );
  }

  loginDryRun(имя_пользователя: string, пароль: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/dry-run`, { имя_пользователя, пароль }).pipe(
      tap(response => {
        console.log('Dry-run login response:', response);
      })
    );
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.usernameKey);
      localStorage.removeItem(this.userIdKey);
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
    return null;
  }

  getUserId(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(this.userIdKey);
    }
    return null;
  }

  isAdmin(): boolean {
    if (this.isBrowser()) {
      return localStorage.getItem(this.userRoleKey) === 'admin';
    }
    return false;
  }

  exportToExcel(): Observable<any> {
    return this.http.get(`${this.apiUrl}/export-excel`);
  }

  exportToExcelDryRun(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/export/dry-run`, {}).pipe(
      tap(response => {
        console.log('Dry-run export response:', response);
      })
    );
  }

  seedDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seed`, {}).pipe(
      tap(response => {
        console.log('Database successfully seeded:', response);
      })
    );
  }

  seedDatabaseDryRun(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seed/dry-run`, {}).pipe(
      tap(response => {
        console.log('Dry-run seeding response:', response);
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

  migrateDatabaseDryRun(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/migrate/dry-run`, {}).pipe(
      tap(response => {
        console.log('Dry-run migration response:', response);
      })
    );
  }
}