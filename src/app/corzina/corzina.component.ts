import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CorzinaService } from './corzina.service';
import { PostavshikService } from '../postavshik/postavshik.service';
import { ProductService } from '../product/product.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-corzina',
  
  templateUrl: './corzina.component.html',
  styleUrls: ['./corzina.component.css']
})
export class CorzinaComponent implements OnInit {
  corzinaItems: any[] = [];
  suppliers: any[] = [];
  total: number = 0;
  notification: { message: string; type: string } | null = null;

  constructor(
    private corzinaService: CorzinaService,
    private postavshikService: PostavshikService,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadCorzina();
      this.loadSuppliers();
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadCorzina(): void {
    this.corzinaService.getCorzina().subscribe({
      next: (data) => {
        console.log('Данные корзины:', data);
        const productRequests = data.map(item => {
          const productId = item.продукт_id || item.productId;
          if (!productId) {
            console.error('продукт_id не определён для элемента корзины:', item);
            return Promise.resolve({
              ...item,
              originalPrice: item.price / (item.quantity || 1),
              photo: '/assets/default-product.jpg',
              product_name: 'Неизвестный продукт',
              productId: null,
              suppliers: item.suppliers_list ? item.suppliers_list.split(';').map((s: string) => {
                const [id, name] = s.split(':');
                return { id: parseInt(id), name };
              }) : [],
              supplier_id: item.supplier_id || null
            });
          }
          return this.productService.getProductById(productId).toPromise()
            .then(product => {
              console.log(`Продукт для ID ${productId}:`, product);
              return {
                ...item,
                originalPrice: item.price / (item.quantity || 1),
                photo: product?.photo ? 
                  (product.photo.startsWith('http') ? product.photo : `${product.photo}`) : 
                  '/assets/default-product.jpg',
                product_name: product?.name || 'Неизвестный продукт',
                productId: productId,
                suppliers: item.suppliers_list ? item.suppliers_list.split(';').map((s: string) => {
                  const [id, name] = s.split(':');
                  return { id: parseInt(id), name };
                }) : [],
                supplier_id: item.supplier_id || null
              };
            })
            .catch(err => {
              console.error(`Ошибка загрузки продукта ${productId}:`, err);
              return {
                ...item,
                originalPrice: item.price / (item.quantity || 1),
                photo: '/assets/default-product.jpg',
                product_name: 'Неизвестный продукт',
                productId: productId,
                suppliers: item.suppliers_list ? item.suppliers_list.split(';').map((s: string) => {
                  const [id, name] = s.split(':');
                  return { id: parseInt(id), name };
                }) : [],
                supplier_id: item.supplier_id || null
              };
            });
        });

        Promise.all(productRequests).then(items => {
          this.corzinaItems = items;
          this.calculateTotal();
          console.log('Обработанные элементы корзины:', this.corzinaItems);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Ошибка при загрузке корзины:', err);
        this.showErrorNotification('Ошибка загрузки корзины');
      }
    });
  }

  loadSuppliers(): void {
    this.postavshikService.getPostavshiks().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка при загрузке поставщиков:', err)
    });
  }

  calculateTotal(): void {
    this.total = this.corzinaItems.reduce((sum, item) => sum + (item.quantity * item.originalPrice), 0);
  }

  getTotalQuantity(): number {
    return this.corzinaItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateQuantity(item: any): void {
    if (item.quantity < 1) {
      item.quantity = 1;
    }
    if (!item.supplier_id) {
      this.showErrorNotification('Пожалуйста, выберите поставщика');
      return;
    }
    item.price = item.quantity * item.originalPrice;
    this.corzinaService.updateCorzina(item.id, item.quantity, item.supplier_id).subscribe({
      next: () => {
        this.calculateTotal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при обновлении количества:', err);
        this.showErrorNotification('Ошибка обновления количества');
      }
    });
  }

  updateSupplier(item: any): void {
    if (!item.supplier_id) {
      this.showErrorNotification('Пожалуйста, выберите поставщика');
      return;
    }
    this.corzinaService.updateCorzina(item.id, item.quantity, item.supplier_id).subscribe({
      next: () => {
        this.calculateTotal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при обновлении поставщика:', err);
        this.showErrorNotification('Ошибка обновления поставщика');
      }
    });
  }

  removeItem(id: number): void {
    this.corzinaService.removeCorzina(id).subscribe({
      next: (response) => {
        const removedItem = this.corzinaItems.find(item => item.id === id);
        this.corzinaItems = this.corzinaItems.filter(item => item.id !== id);
        this.calculateTotal();
        if (removedItem) {
          this.corzinaService.corzinaChange.next(removedItem.productId);
        }
        this.cdr.detectChanges();
        this.showNotification('Товар удален из корзины');
      },
      error: (err) => {
        console.error('Ошибка при удалении товара:', err);
        this.showErrorNotification('Ошибка удаления товара');
      }
    });
  }

  goToCategories(): void {
    this.router.navigate(['/categories']);
  }

  createOrder(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.corzinaItems.length === 0) {
      this.showErrorNotification('Корзина пуста');
      return;
    }
    const invalidItems = this.corzinaItems.filter(item => !item.supplier_id);
    if (invalidItems.length > 0) {
      this.showErrorNotification('Пожалуйста, выберите поставщика для всех товаров');
      return;
    }
    const supplierId = this.corzinaItems[0].supplier_id;
    const items = this.corzinaItems.map(item => ({
      product_id: item.productId,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.originalPrice,
      photo: item.photo
    }));
    console.log('Формируем items для заказа:', items);
    console.log('corzinaItems перед созданием заказа:', this.corzinaItems);
    this.corzinaService.createOrder(this.total, supplierId, items).subscribe({
      next: (response: { success: boolean; orderId?: number; message?: string }) => {
        if (response.success) {
          this.corzinaItems = [];
          this.total = 0;
          this.showSuccessNotification('Заказ успешно создан!');
          this.router.navigate(['/zakaz']);
          this.corzinaService.corzinaChange.next(null);
          this.cdr.detectChanges();
        } else {
          this.showErrorNotification(response.message || 'Ошибка при создании заказа');
        }
      },
      error: (err) => {
        console.error('Ошибка при создании заказа:', err);
        const errorMessage = err.error?.message || 'Ошибка при создании заказа. Пожалуйста, попробуйте позже.';
        this.showErrorNotification(errorMessage);
      }
    });
  }

  formatPrice(price: number): string {
    if (!price) return '0 ₽';
    const formatted = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
    return `${formatted} ₽`;
  }

  private showNotification(message: string): void {
    this.notification = { message, type: 'info' };
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  private showSuccessNotification(message: string): void {
    this.notification = { message, type: 'success' };
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  private showErrorNotification(message: string): void {
    this.notification = { message, type: 'error' };
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 5000);
  }
}