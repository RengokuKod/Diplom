import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZakazComponent } from './zakaz.component';
import { ZakazService } from './zakaz.service'; // Убедитесь, что путь правильный
import { AuthService } from '../auth/auth.service';
@NgModule({
  declarations: [
    ZakazComponent
  ],
  imports: [
    CommonModule // Импортируем CommonModule для директив ngIf, ngFor и т.д.
  ],
  providers: [
    AuthService,
    ZakazService // Если хотите использовать сервис в данной области
  ],
  exports: [
    ZakazComponent // Экспортируем компонент для использования в других модулях
  ]
})
export class ZakazModule { }