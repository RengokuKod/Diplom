import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ProductService } from '../product/product.service';
import { DecimalPipe } from '@angular/common';
import { CorzinaService } from '../corzina/corzina.service';
import { IzbranService } from '../izbran/izbran.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DecimalPipe],
  animations: [
    trigger('fadeInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('discountCarousel') discountCarousel!: ElementRef;
  @ViewChild('topCarousel') topCarousel!: ElementRef;

  firstRowItems = [
    { 
      title: 'Профессиональное оборудование', 
      text: 'Мы предлагаем только качественное сетевое оборудование от проверенных производителей',
      icon: 'fa-server'
    },
    { 
      title: 'Быстрая доставка', 
      text: 'Доставка по всей России в кратчайшие сроки',
      icon: 'fa-truck-fast'
    },
    { 
      title: 'Техническая поддержка', 
      text: 'Квалифицированные специалисты всегда готовы помочь',
      icon: 'fa-headset'
    }
  ];

  secondRowItems = [
    { 
      title: 'Гарантия качества', 
      text: 'Все товары имеют официальную гарантию производителя',
      icon: 'fa-medal'
    },
    { 
      title: 'Гибкие условия оплаты', 
      text: 'Различные способы оплаты, включая рассрочку',
      icon: 'fa-credit-card'
    }
  ];

  discountedProducts: any[] = [];
  topRatedProducts: any[] = [];
  discountOffset = 0;
  topOffset = 0;
  cardWidth = 0;
  autoSlideInterval: any;
  isLoading = true;
  isBrowser: boolean;
  cartItemIds: Set<number> = new Set();
  izbranIds: Set<number> = new Set();
  notification: {message: string, type: string} | null = null;
  private corzinaSubscription: Subscription;

  constructor(
    private productService: ProductService,
    private decimalPipe: DecimalPipe,
    private corzinaService: CorzinaService,
    private izbranService: IzbranService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.corzinaSubscription = this.corzinaService.corzinaChange.subscribe((productId) => {
      if (productId === null) {
        this.loadCartItems();
      } else {
        if (this.cartItemIds.has(productId)) {
          this.cartItemIds.delete(productId);
          this.showNotification('Товар удален из корзины', 'success');
        } else {
          this.cartItemIds.add(productId);
          this.showNotification('Товар добавлен в корзину', 'success');
        }
      }
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCartItems();
    this.loadWishlistItems();
    if (this.isBrowser) {
      this.calculateCardWidth();
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  ngOnDestroy(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
    if (this.isBrowser && window) {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
    this.corzinaSubscription.unsubscribe();
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

  loadProducts() {
    this.productService.getDiscountedProducts().subscribe({
      next: (response: any) => {
        this.discountedProducts = (response.data || []).map((product: any) => ({
          ...product,
          discount: product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 10,
          category_name: product.category_name || 'Unknown',
          photo: this.normalizePhotoPath(product.photo, product.category_name || 'Unknown')
        }));
        this.isLoading = false;
        if (this.isBrowser) {
          this.startAutoSlide();
        }
        console.log('Loaded discounted products:', this.discountedProducts);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading discounted products:', err);
        this.discountedProducts = [];
        this.isLoading = false;
        this.showNotification('Ошибка загрузки товаров со скидкой', 'error');
        this.cdr.detectChanges();
      }
    });

    this.productService.getTopRatedProducts().subscribe({
      next: (response: any) => {
        this.topRatedProducts = (response.data || []).map((product: any) => ({
          ...product,
          category_name: product.category_name || 'Unknown',
          photo: this.normalizePhotoPath(product.photo, product.category_name || 'Unknown')
        }));
        console.log('Loaded top-rated products:', this.topRatedProducts);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading top-rated products:', err);
        this.topRatedProducts = [];
        this.showNotification('Ошибка загрузки топовых товаров', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  loadCartItems(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;
    
    this.corzinaService.getCorzina().subscribe({
      next: (items) => {
        this.cartItemIds = new Set(items.map((item: any) => item.productId));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка загрузки корзины:', err)
    });
  }

  loadWishlistItems(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;
    
    this.izbranService.getIzbrans(userId).subscribe({
      next: (items) => {
        this.izbranIds = new Set(items.map((item: any) => item.productId));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка загрузки избранного:', err)
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.calculateCardWidth();
    }
  }

  onResize() {
    this.calculateCardWidth();
  }

  calculateCardWidth() {
    if (this.discountCarousel && this.discountCarousel.nativeElement) {
      const carouselWidth = this.discountCarousel.nativeElement.offsetWidth;
      this.cardWidth = carouselWidth / 3;
      this.cdr.detectChanges();
    }
  }

  startAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
    this.autoSlideInterval = setInterval(() => {
      this.nextDiscountSlide();
      this.nextTopSlide();
    }, 5000);
  }

  nextDiscountSlide() {
    if (this.discountedProducts.length <= 3) return;
    if (this.discountOffset > -((this.discountedProducts.length - 3) * this.cardWidth)) {
      this.discountOffset -= this.cardWidth;
    } else {
      this.discountOffset = 0;
    }
    this.cdr.detectChanges();
  }

  prevDiscountSlide() {
    if (this.discountedProducts.length <= 3) return;
    if (this.discountOffset < 0) {
      this.discountOffset += this.cardWidth;
    } else {
      this.discountOffset = -((this.discountedProducts.length - 3) * this.cardWidth);
    }
    this.cdr.detectChanges();
  }

  nextTopSlide() {
    if (this.topRatedProducts.length <= 3) return;
    if (this.topOffset > -((this.topRatedProducts.length - 3) * this.cardWidth)) {
      this.topOffset -= this.cardWidth;
    } else {
      this.topOffset = 0;
    }
    this.cdr.detectChanges();
  }

  prevTopSlide() {
    if (this.topRatedProducts.length <= 3) return;
    if (this.topOffset < 0) {
      this.topOffset += this.cardWidth;
    } else {
      this.topOffset = -((this.topRatedProducts.length - 3) * this.cardWidth);
    }
    this.cdr.detectChanges();
  }

  addToCart(productId: number, price: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.corzinaService.addToCorzina(productId, 1, price).subscribe({
      next: () => {
        this.cartItemIds.add(productId);
        this.showNotification('Товар добавлен в корзину', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при добавлении в корзину:', err);
        this.showNotification('Ошибка при добавлении в корзину', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  toggleWishlist(productId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (this.izbranIds.has(productId)) {
      this.izbranService.removeFromIzbran(productId, userId).subscribe({
        next: () => {
          this.izbranIds.delete(productId);
          this.showNotification('Товар удален из избранного', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Ошибка при удалении из избранного:', err);
          this.showNotification('Ошибка при удалении из избранного', 'error');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.izbranService.addToIzbran(userId, productId).subscribe({
        next: () => {
          this.izbranIds.add(productId);
          this.showNotification('Товар добавлен в избранное', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Ошибка при добавлении в избранное:', err);
          this.showNotification('Ошибка при добавлении в избранное', 'error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  showNotification(message: string, type: string) {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  formatPrice(price: number): string {
    if (!price) return '0 ₽';
    const formatted = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
    return `${formatted} ₽`;
  }

  getStarRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return '★'.repeat(fullStars) + '☆'.repeat(halfStar) + '☆'.repeat(emptyStars);
  }

  formatRating(rating: number): string {
    return this.decimalPipe.transform(rating, '1.1-1') || '0.0';
  }

  goToProductDescription(productId: number, categoryName: string, price: number): void {
    this.router.navigate(['/opisanie'], {
      queryParams: { productId, categoryName, price }
    });
  }
}