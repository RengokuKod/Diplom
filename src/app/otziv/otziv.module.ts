import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OtzivComponent } from './otziv.component';
import { OtzivService } from './otziv.service'; // Убедитесь, что путь правильный
import { AuthService } from '../auth/auth.service';
@NgModule({
  declarations: [
    OtzivComponent
  ],
  imports: [
    CommonModule // Импортируем CommonModule для директив ngIf, ngFor и т.д.
  ],
  providers: [
    AuthService,
    OtzivService // Если хотите использовать сервис в данной области
  ],
  exports: [
    OtzivComponent // Экспортируем компонент для использования в других модулях
  ]
})
export class OtzivModule { }