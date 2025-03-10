import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IzbranComponent } from './izbran.component';
import { IzbranService } from './izbran.service'; // Убедитесь, что путь правильный
import { AuthService } from '../auth/auth.service';
@NgModule({
  declarations: [
    IzbranComponent
  ],
  imports: [
    CommonModule // Импортируем CommonModule для директив ngIf, ngFor и т.д.
  ],
  providers: [
    AuthService,
    IzbranService // Если хотите использовать сервис в данной области
  ],
  exports: [
    IzbranComponent // Экспортируем компонент для использования в других модулях
  ]
})
export class IzbranModule { }