import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TableData {
  id?: number;
  фото?: string | null;
  [key: string]: any;
}

export interface TableConfig {
  fields: string[];
  displayNames: string[];
  types: string[];
  enums: { [key: string]: string[] };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getTableData(table: string): Observable<{ success: boolean, data: TableData[], config: TableConfig }> {
    return this.http.get<{ success: boolean, data: TableData[], config: TableConfig }>(`${this.apiUrl}/admin/${table}`).pipe(
      catchError((error) => {
        console.error(`Ошибка при запросе данных таблицы ${table}:`, error);
        return throwError(() => new Error(`Не удалось загрузить данные таблицы ${table}: ${error.message}`));
      })
    );
  }

  getTableDataDryRun(table: string): Observable<{ success: boolean }> {
    return this.http.get<{ success: boolean }>(`${this.apiUrl}/admin/${table}/dry-run`).pipe(
      catchError((error) => {
        console.error(`Ошибка при тестовом доступе к таблице ${table}:`, error);
        return throwError(() => new Error(`Не удалось получить данные таблицы в тестовом режиме: ${error.message}`));
      })
    );
  }

  createRecord(table: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${table}`, data).pipe(
      catchError((error) => {
        console.error(`Ошибка при создании записи в таблице ${table}:`, error);
        return throwError(() => new Error(`Не удалось создать запись: ${error.message}`));
      })
    );
  }

  createRecordDryRun(table: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${table}/dry-run`, data).pipe(
      catchError((error) => {
        console.error(`Ошибка при тестовом создании записи в таблице ${table}:`, error);
        return throwError(() => new Error(`Не удалось создать тестовую запись: ${error.message}`));
      })
    );
  }

  updateRecord(table: string, id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${table}/${id}`, data).pipe(
      catchError((error) => {
        console.error(`Ошибка при обновлении записи в таблице ${table}:`, error);
        return throwError(() => new Error(`Не удалось обновить запись: ${error.message}`));
      })
    );
  }

  updateRecordDryRun(table: string, id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${table}/${id}/dry-run`, data).pipe(
      catchError((error) => {
        console.error(`Ошибка при тестовом обновлении записи в таблице ${table}:`, error);
        return throwError(() => new Error(`Не удалось обновить тестовую запись: ${error.message}`));
      })
    );
  }

  deleteRecord(table: string, id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${table}/${id}`).pipe(
      catchError((error) => {
        console.error(`Ошибка при удалении записи в таблице ${table}:`, error);
        return throwError(() => new Error(`Не удалось удалить запись: ${error.message}`));
      })
    );
  }

  deleteRecordDryRun(table: string, id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${table}/${id}/dry-run`).pipe(
      catchError((error) => {
        console.error(`Ошибка при тестовом удалении записи из таблицы ${table}:`, error);
        return throwError(() => new Error(`Не удалось удалить тестовую запись: ${error.message}`));
      })
    );
  }

  initiateImageDownload(): Observable<any> {
    return this.http.post(`${this.apiUrl}/download-images`, {}).pipe(
      catchError((error) => {
        console.error('Ошибка при инициации скачивания изображений:', error);
        return throwError(() => new Error(`Не удалось инициировать скачивание: ${error.message}`));
      })
    );
  }

  getDownloadProgress(): Observable<any> {
    return this.http.get(`${this.apiUrl}/download-progress`).pipe(
      catchError((error) => {
        console.error('Ошибка при получении прогресса скачивания:', error);
        return throwError(() => new Error(`Не удалось получить прогресс: ${error.message}`));
      })
    );
  }
}