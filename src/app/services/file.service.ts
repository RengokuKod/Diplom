import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private http: HttpClient) {}

  initiateImageDownload(): Observable<any> {
    return this.http.post('/api/initiate-image-download', {});
  }

  getDownloadProgress(): Observable<{total: number, completed: number, errors: number}> {
    return interval(1000).pipe(
      switchMap(() => this.http.get<{total: number, completed: number, errors: number}>('/api/download-progress')),
      takeWhile(response => response.completed < response.total, true)
    );
  }

  checkImageExists(imagePath: string): Observable<boolean> {
    return this.http.head(imagePath, { observe: 'response' }).pipe(
      switchMap(response => {
        return new Observable<boolean>(observer => {
          observer.next(response.status === 200);
          observer.complete();
        });
      })
    );
  }
}