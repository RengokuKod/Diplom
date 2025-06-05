// src/app/product/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getDiscountedProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/discounted`).pipe(
      catchError(err => {
        console.error('Error loading discounted products:', err);
        return of([]);
      })
    );
  }

  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`).pipe(
      catchError(err => {
        console.error('Error loading product:', err);
        return of(null);
      })
    );
  }

  getTopRatedProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/top-rated`).pipe(
      catchError(err => {
        console.error('Error loading top rated products:', err);
        return of([]);
      })
    );
  }

  getProducts(categoryName: string, params: any = {}): Observable<any[]> {
    let httpParams = new HttpParams().set('categoryName', categoryName);
    
    // Фильтрация
    if (params.minPrice) httpParams = httpParams.set('minPrice', params.minPrice);
    if (params.maxPrice) httpParams = httpParams.set('maxPrice', params.maxPrice);
    if (params.minRating) httpParams = httpParams.set('minRating', params.minRating);
    if (params.maxRating) httpParams = httpParams.set('maxRating', params.maxRating);
    if (params.minStock) httpParams = httpParams.set('minStock', params.minStock);
    if (params.maxStock) httpParams = httpParams.set('maxStock', params.maxStock);
    
    // Сортировка
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
      httpParams = httpParams.set('sortOrder', params.sortOrder || 'asc');
    }

    return this.http.get<any[]>(`${this.apiUrl}/products`, { params: httpParams }).pipe(
      catchError(err => {
        console.error('Error loading products:', err);
        return of([]);
      })
    );
  }

  searchProducts(query: string, categoryName: string): Observable<any[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('categoryName', categoryName);
    console.log('Sending search request with params:', params.toString());
    return this.http.get<any[]>(`${this.apiUrl}/products/search`, { params }).pipe(
      catchError(err => {
        console.error('Error searching products:', err);
        return of([]);
      })
    );
  }

  getProductDescription(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/opisanie`, {
      params: { productId: productId.toString() }
    }).pipe(
      catchError(err => {
        console.error('Error loading product description:', err);
        return of({});
      })
    );
  }
}