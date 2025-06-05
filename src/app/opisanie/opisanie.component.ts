import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { OpisanieService } from './opisanie.service';
import { ProductService } from '../product/product.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CorzinaService } from '../corzina/corzina.service';
import { IzbranService } from '../izbran/izbran.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-opisanie',
  templateUrl: './opisanie.component.html',
  styleUrls: ['./opisanie.component.css']
})
export class OpisanieComponent implements OnInit, OnDestroy {
  opisanie: any = {};
  images: string[] = [];
  currentImageIndex: number = 0;
  productId: number | null = null;
  categoryName: string | null = null; // Добавляем поле для хранения categoryName
  cartItemIds: Set<number> = new Set();
  isInWishlist: boolean = false;
  isLoading: boolean = true;
  error: string | null = null;
  productPrice: number = 0;
  notification: { message: string, type: string } | null = null;

  constructor(
    private opisanieService: OpisanieService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private corzinaService: CorzinaService,
    private izbranService: IzbranService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.productId = params['productId'] ? Number(params['productId']) : null;
      this.productPrice = params['price'] ? Number(params['price']) : 0;
      this.categoryName = params['categoryName'] || null; // Сохраняем categoryName из queryParams

      if (this.productId) {
        this.loadProductDescription();
        this.checkCartStatus();
        this.checkWishlistStatus();
        if (!this.productPrice) {
          this.error = 'Цена товара не указана';
        }
      } else {
        this.error = 'Не указан ID товара';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {}

  loadProductDescription(): void {
    if (!this.productId) return;

    this.isLoading = true;
    this.error = null;

    this.opisanieService.getOpisanie(this.productId).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          this.opisanie = data[0];
        } else {
          this.error = 'Описание товара не найдено';
          this.opisanie = {
            brand: 'Unknown',
            model: 'Unknown'
          };
        }
        this.loadProductImage();
      },
      error: (err) => {
        console.error('Ошибка при загрузке описания:', err);
        this.error = err.message || 'Не удалось загрузить описание товара';
        this.isLoading = false;
        this.opisanie = {
          brand: 'Unknown',
          model: 'Unknown'
        };
        this.loadProductImage();
        this.cdr.detectChanges();
      }
    });
  }

  loadProductImage(): void {
    if (!this.productId) return;

    this.productService.getProductById(this.productId).subscribe({
      next: (product: any) => {
        this.images = [];
        const photo = product?.photo;
        if (photo) {
          const imgPath = photo.startsWith('http') ? photo : `${photo}`;
          this.images.push(imgPath);
        }
        if (this.images.length === 0) {
          this.images = ['/assets/default-product.jpg'];
        }
        // Если categoryName не передан через queryParams, берем из данных продукта
        if (!this.categoryName && product?.category_name) {
          this.categoryName = product.category_name;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при загрузке изображения продукта:', err);
        this.images = ['/assets/default-product.jpg'];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  checkCartStatus(): void {
    const userId = this.authService.getUserId();
    if (!userId || !this.productId) {
      this.cartItemIds.clear();
      return;
    }
    
    this.corzinaService.getCorzina().subscribe({
      next: (items) => {
        this.cartItemIds = new Set(items.map(item => item.productId));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при проверке корзины:', err);
        this.cartItemIds.clear();
      }
    });
  }

  checkWishlistStatus(): void {
    const userId = this.authService.getUserId();
    if (!userId || !this.productId) {
      this.isInWishlist = false;
      return;
    }
    
    this.izbranService.getIzbrans(userId).subscribe({
      next: (items) => {
        this.isInWishlist = items.some(item => item.productId === this.productId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при проверке избранного:', err);
        this.isInWishlist = false;
      }
    });
  }

  addToCart(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.productId || !this.productPrice) {
      this.showNotification('Не указан ID товара или цена', 'error');
      return;
    }
    
    this.corzinaService.addToCorzina(this.productId, 1, this.productPrice).subscribe({
      next: () => {
        this.cartItemIds.add(this.productId!);
        this.showNotification('Товар добавлен в корзину', 'success');
        this.corzinaService.corzinaChange.next(this.productId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при добавлении в корзину:', err);
        this.showNotification('Ошибка при добавлении в корзину', 'error');
      }
    });
  }

  toggleWishlist(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.productId) return;
    
    if (this.isInWishlist) {
      this.izbranService.removeFromIzbran(this.productId, userId).subscribe({
        next: () => {
          this.isInWishlist = false;
          this.showNotification('Товар удален из избранного', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Ошибка при удалении из избранного:', err);
          this.showNotification('Ошибка при удалении из избранного', 'error');
        }
      });
    } else {
      this.izbranService.addToIzbran(userId, this.productId).subscribe({
        next: () => {
          this.isInWishlist = true;
          this.showNotification('Товар добавлен в избранное', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Ошибка при добавлении в избранное:', err);
          this.showNotification('Ошибка при добавлении в избранное', 'error');
        }
      });
    }
  }

  showNotification(message: string, type: string): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 2000);
  }

  prevImage(): void {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
  }

  goBackToProducts(): void {
    // Переходим на /products с параметром categoryName
    this.router.navigate(['/products'], { 
      queryParams: { categoryName: this.categoryName || 'all' }
    });
  }

  formatPrice(price: number): string {
    if (!price) return '0 ₽';
    const formatted = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
    return `${formatted} ₽`;
  }
}