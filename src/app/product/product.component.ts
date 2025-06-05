import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProductService } from './product.service';
import { CorzinaService } from '../corzina/corzina.service';
import { IzbranService } from '../izbran/izbran.service';
import { AuthService } from '../auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit, OnDestroy {
  products: any[] = [];
  filteredProducts: any[] = [];
  categoryName: string = '';
  izbranIds: Set<number> = new Set();
  corzinaIds: Set<number> = new Set();
  notification: string | null = null;
  searchSuggestions: string[] = [];
  showSuggestions: boolean = false;
  noResults: boolean = false;
  
  // Фильтры
  priceMin: number | null = null;
  priceMax: number | null = null;
  ratingMin: number | null = null;
  ratingMax: number | null = null;
  stockMin: number | null = null;
  stockMax: number | null = null;
  
  // Сортировка
  selectedSort: string = '';
  searchQuery: string = '';
  
  private izbranSubscription!: Subscription;
  private corzinaSubscription!: Subscription;
  private searchSubscription: Subscription | null = null;

  constructor(
    private productService: ProductService,
    private corzinaService: CorzinaService,
    private izbranService: IzbranService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    this.route.queryParams.subscribe(params => {
      this.categoryName = params['categoryName'] || '';
      this.loadProducts();
      
      if (userId) {
        this.loadIzbranAndCorzina(userId);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.izbranSubscription) this.izbranSubscription.unsubscribe();
    if (this.corzinaSubscription) this.corzinaSubscription.unsubscribe();
    if (this.searchSubscription) this.searchSubscription.unsubscribe();
  }

  // Вспомогательная функция для нормализации пути к изображению
  private normalizePhotoPath(photo: string | null, categoryName: string): string {
    if (!photo) {
      return '/assets/default.jpg';
    }
    if (photo.startsWith('http') || photo.startsWith('/assets/')) {
      return photo;
    }
    return `/assets/${categoryName}/${photo}`;
  }

  loadProducts(): void {
    if (!this.categoryName) {
      console.warn('categoryName не указан, загрузка всех продуктов');
      this.categoryName = 'all';
    }
    this.productService.getProducts(this.categoryName).subscribe({
      next: (products) => {
        this.products = products.map(product => {
          const photoPath = this.normalizePhotoPath(product.photo, product.category_name || 'Unknown');
          console.log(`Product: ${product.name}, Photo Path: ${photoPath}`);
          return {
            ...product,
            category_name: product.category_name || 'Unknown',
            photo: photoPath
          };
        });
        this.filteredProducts = [...this.products];
        this.noResults = this.filteredProducts.length === 0;
        this.applyFilters();
        this.cdr.detectChanges();
        console.log('Loaded products:', this.products);
      },
      error: (err) => console.error('Ошибка при загрузке продуктов:', err)
    });
  }

  loadIzbranAndCorzina(userId: string): void {
    this.izbranService.getIzbrans(userId).subscribe({
      next: (izbrans) => {
        this.izbranIds = new Set(izbrans.map(izbran => izbran.productId));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка при загрузке избранного:', err)
    });

    this.corzinaService.getCorzina().subscribe({
      next: (corzina) => {
        this.corzinaIds = new Set(corzina.map(item => item.productId));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка при загрузке корзины:', err)
    });
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(product => {
      // Фильтр по цене
      if (this.priceMin !== null && product.price < this.priceMin) return false;
      if (this.priceMax !== null && product.price > this.priceMax) return false;
      
      // Фильтр по рейтингу
      if (this.ratingMin !== null && product.rating < this.ratingMin) return false;
      if (this.ratingMax !== null && product.rating > this.ratingMax) return false;
      
      // Фильтр по запасам
      if (this.stockMin !== null && product.stock < this.stockMin) return false;
      if (this.stockMax !== null && product.stock > this.stockMax) return false;
      
      // Фильтр по поисковому запросу
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        return product.name.toLowerCase().includes(query);
      }
      
      return true;
    });
    
    this.noResults = this.filteredProducts.length === 0;
    this.applySort();
    console.log('After applyFilters, filteredProducts:', this.filteredProducts);
  }

  applySort(): void {
    if (!this.selectedSort) return;
    
    const [sortField, sortOrder] = this.selectedSort.split('_');
    
    this.filteredProducts.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortField) {
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'popular':
          valueA = a.rating * a.reviews;
          valueB = b.rating * b.reviews;
          break;
        case 'newest':
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        case 'reviews':
          valueA = a.reviews;
          valueB = b.reviews;
          break;
        case 'rating':
          valueA = a.rating;
          valueB = b.rating;
          break;
        case 'questions':
          valueA = a.questions;
          valueB = b.questions;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  }

  updateSuggestions(): void {
    if (!this.searchQuery) {
      this.searchSuggestions = [];
      this.showSuggestions = false;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.searchSuggestions = this.products
      .filter(product => product.name.toLowerCase().includes(query))
      .map(product => product.name)
      .slice(0, 5);
    
    this.showSuggestions = this.searchSuggestions.length > 0;
    this.cdr.detectChanges();
    console.log('Search suggestions:', this.searchSuggestions);
  }

  searchProducts(query: string): void {
    console.log('searchProducts called with query:', query);

    // Обновляем подсказки
    this.updateSuggestions();

    // Очищаем предыдущую подписку
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    if (!query.trim()) {
      this.filteredProducts = [...this.products];
      this.searchSuggestions = [];
      this.showSuggestions = false;
      this.noResults = false;
      this.applyFilters();
      this.cdr.detectChanges();
      console.log('Empty query, filteredProducts:', this.filteredProducts);
      return;
    }

    const searchQuery = query.toLowerCase();
    // Клиентская фильтрация как запасной вариант
    const clientFiltered = this.products.filter(product =>
      product.name.toLowerCase().includes(searchQuery)
    );

    // Запрос к бэкенду
    this.searchSubscription = this.productService.searchProducts(query, this.categoryName)
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe({
        next: (backendProducts) => {
          console.log('Backend search response:', backendProducts);
          // Проверяем, что бэкенд вернул массив
          if (Array.isArray(backendProducts)) {
            this.filteredProducts = backendProducts.map(product => ({
              ...product,
              photo: this.normalizePhotoPath(product.photo, product.category_name || 'Unknown')
            }));
            this.noResults = this.filteredProducts.length === 0;
          } else {
            this.filteredProducts = clientFiltered;
            this.noResults = this.filteredProducts.length === 0;
          }
          this.applyFilters();
          this.cdr.detectChanges();
          console.log('Final filteredProducts:', this.filteredProducts);
        },
        error: (err) => {
          console.error('Backend search error:', err);
          this.filteredProducts = clientFiltered;
          this.noResults = this.filteredProducts.length === 0;
          this.searchSuggestions = [];
          this.showSuggestions = false;
          this.applyFilters();
          this.cdr.detectChanges();
          console.log('Error, filteredProducts:', this.filteredProducts);
        }
      });
  }

  applyFiltersAndSort(): void {
    console.log('applyFiltersAndSort called');
    this.applyFilters();
    this.cdr.detectChanges();
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.searchProducts(suggestion);
    this.showSuggestions = false;
  }

  toggleIzbran(productId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (this.izbranIds.has(productId)) {
      this.izbranService.removeFromIzbran(productId, userId).subscribe({
        next: () => {
          this.izbranIds.delete(productId);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Ошибка при удалении из избранного:', err)
      });
    } else {
      this.izbranService.addToIzbran(userId, productId).subscribe({
        next: () => {
          this.izbranIds.add(productId);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Ошибка при добавлении в избранное:', err)
      });
    }
  }

  addToCorzina(productId: number, price: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.corzinaService.addToCorzina(productId, 1, price).subscribe({
      next: () => {
        this.corzinaIds.add(productId);
        this.cdr.detectChanges();
        this.showNotification('Товар добавлен в корзину');
      },
      error: (err) => console.error('Ошибка при добавлении в корзину:', err)
    });
  }

  showNotification(message: string): void {
    this.notification = message;
    setTimeout(() => this.notification = null, 3000);
  }

  formatPrice(price: number): string {
    return price ? 
      new Intl.NumberFormat('ru-RU', { 
        style: 'currency', 
        currency: 'RUB', 
        maximumFractionDigits: 0 
      }).format(price).replace(/\u00A0/g, '\u2009') : '0 ₽';
  }
}