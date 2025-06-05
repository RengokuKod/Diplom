import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { IzbranService } from './izbran.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { CorzinaService } from '../corzina/corzina.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-izbran',
  templateUrl: './izbran.component.html',
  styleUrls: ['./izbran.component.css']
})
export class IzbranComponent implements OnInit {
  izbrans: any[] = [];
  corzinaIds: Set<number> = new Set();
  notification: string | null = null;

  constructor(
    private izbranService: IzbranService,
    private authService: AuthService,
    private corzinaService: CorzinaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadIzbrans(userId);
      this.loadCorzina(userId);
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadIzbrans(userId: string): void {
    this.izbranService.getIzbrans(userId).subscribe({
      next: (data) => {
        this.izbrans = data.map(item => ({
          ...item,
          photo: item.photo || '/assets/default-product.jpg'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при загрузке избранного:', err);
        this.showError('Не удалось загрузить избранное');
      }
    });
  }

  loadCorzina(userId: string): void {
    this.corzinaService.getCorzina().subscribe({
      next: (corzina) => {
        this.corzinaIds = new Set(corzina.map(item => item.productId));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка при загрузке корзины:', err)
    });
  }

  removeFromIzbran(id: number): void {
    const userId = this.authService.getUserId();
    if (userId) {
      const productId = this.izbrans.find(item => item.id === id)?.productId;
      this.izbranService.removeFromIzbran(productId, userId).subscribe({
        next: () => {
          this.izbrans = this.izbrans.filter(item => item.id !== id);
          this.izbranService.izbranChange.next(productId);
          this.showSuccess('Товар удален из избранного');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Ошибка при удалении:', err);
          this.showError('Не удалось удалить товар');
        }
      });
    }
  }

  goToCategories(): void {
    this.router.navigate(['/categories']);
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
        this.corzinaService.corzinaChange.next(productId);
        this.showNotification('Товар добавлен в корзину');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка при добавлении в корзину:', err);
        this.showError('Не удалось добавить товар в корзину');
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Закрыть', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Закрыть', {
      duration: 3000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showNotification(message: string): void {
    this.notification = message;
    setTimeout(() => {
      this.notification = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}