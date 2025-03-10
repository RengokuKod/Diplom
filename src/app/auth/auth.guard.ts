import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): boolean {
    
    if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/']); // Перенаправить на главную страницу, если не аутентифицирован
        return false; // Запретить доступ
    }

    const userRole = this.authService.getUserRole();
    console.log('Проверка роли пользователя:', userRole);
    if (userRole && userRole === 'admin') { // Добавлено условие, чтобы избежать ошибки
        return true; // Разрешить доступ
    } else {
        this.router.navigate(['/']); // Перенаправить на главную страницу
        
        return false; // Запретить доступ
    }
}
}