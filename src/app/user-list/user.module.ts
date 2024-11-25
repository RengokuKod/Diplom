import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserListComponent } from './user-list.component';
import { UserService } from '../user.service'; // Убедитесь, что путь правильный

@NgModule({
  declarations: [
    UserListComponent
  ],
  imports: [
    CommonModule // Импортируем CommonModule для директив ngIf, ngFor и т.д.
  ],
  providers: [
    UserService // Если хотите использовать сервис в данной области
  ],
  exports: [
    UserListComponent // Экспортируем компонент для использования в других модулях
  ]
})
export class UserModule { }