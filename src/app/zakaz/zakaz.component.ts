import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ZakazService } from './zakaz.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-zakaz',
  templateUrl: './zakaz.component.html',
  styleUrls: ['./zakaz.component.css']
})
export class ZakazComponent implements OnInit {
  orders: any[] = [];
  notification: { message: string; type: string } | null = null;
  expandedItems: Set<number> = new Set();

  constructor(
    private zakazService: ZakazService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.getUserId()) {
      this.showError('Пожалуйста, войдите в систему');
      this.router.navigate(['/login']);
      return;
    }
    this.loadOrders();
  }

  loadOrders(): void {
    this.zakazService.getOrders().subscribe({
      next: (data: any[]) => {
        this.orders = data.map(order => ({
          id: order.id,
          status: order.статус || 'не_оплачен',
          createdAt: order.дата_создания,
          username: order.пользователь_имя || 'Неизвестный пользователь',
          total: order.итого || 0,
          updatedAt: order.дата_обновления,
          address: order.адрес_доставки || 'Не указан',
          paymentMethod: order.способ_оплаты || 'Не указан',
          supplier: order.поставщик || 'Не указан',
          deliveryDays: order.дни_на_доставку || null,
          items: order.товары.map((item: any) => ({
            photo: item.photo || '/assets/default-product.jpg',
            productName: item.product_name || 'Без названия',
            productId: item.product_id || 'N/A',
            quantity: item.quantity || 1,
            price: item.price || 0
          })) || [],
          trackingNumber: order.трэк_номер || null
        }));
        console.log('Загруженные заказы:', this.orders);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при загрузке заказов:', err);
        this.showError(err.message || 'Не удалось загрузить заказы');
      }
    });
  }

  toggleItems(orderId: number): void {
    if (this.expandedItems.has(orderId)) {
      this.expandedItems.delete(orderId);
    } else {
      this.expandedItems.add(orderId);
    }
    this.cdr.detectChanges();
  }

  removeOrder(orderId: number): void {
    if (!this.authService.getUserId()) {
      this.showError('Пожалуйста, войдите в систему');
      this.router.navigate(['/login']);
      return;
    }
    this.zakazService.removeOrder(orderId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.orders = this.orders.filter(order => order.id !== orderId);
          this.showSuccess('Заказ успешно удален');
        }
      },
      error: (err) => {
        console.error('Ошибка при удалении заказа:', err);
        this.showError(err.message || 'Не удалось удалить заказ');
      }
    });
  }

  goToCorzina(): void {
    this.router.navigate(['/corzina']);
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-new';
    switch (status.toLowerCase()) {
      case 'не_оплачен': return 'status-new';
      case 'оплачен': return 'status-processing';
      case 'в_доставке': return 'status-shipping';
      case 'доставлен': return 'status-completed';
      case 'отменён': return 'status-cancelled';
      default: return 'status-new';
    }
  }

  getStatusText(status: string): string {
    if (!status) return 'Не оплачен';
    switch (status.toLowerCase()) {
      case 'не_оплачен': return 'Не оплачен';
      case 'оплачен': return 'Оплачен';
      case 'в_доставке': return 'В доставке';
      case 'доставлен': return 'Доставлен';
      case 'отменён': return 'Отменён';
      default: return status;
    }
  }

  formatPrice(price: number): string {
    if (!price) return '0 ₽';
    const formatted = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
    return `${formatted} ₽`;
  }

  private showSuccess(message: string): void {
    this.notification = { message, type: 'success' };
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  private showError(message: string): void {
    this.notification = { message, type: 'error' };
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}