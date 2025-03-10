import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostavshikComponent } from './postavshik.component';
import { PostavshikService } from './postavshik.service'; // Убедитесь, что путь правильный
import { AuthService } from '../auth/auth.service';
@NgModule({
  declarations: [
    PostavshikComponent
  ],
  imports: [
    CommonModule // Импортируем CommonModule для директив ngIf, ngFor и т.д.
  ],
  providers: [
    AuthService,
    PostavshikService // Если хотите использовать сервис в данной области
  ],
  exports: [
    PostavshikComponent // Экспортируем компонент для использования в других модулях
  ]
})
export class PostavshikModule { }