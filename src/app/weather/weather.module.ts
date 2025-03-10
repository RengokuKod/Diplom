import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherComponent } from './weather.component';
import { WeatherService } from './weather.service'; // Убедитесь, что путь правильный
import { AuthService } from '../auth/auth.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    WeatherComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule // Импортируем CommonModule для директив ngIf, ngFor и т.д.
  ],
  providers: [
    AuthService,
    WeatherService // Если хотите использовать сервис в данной области
  ],
  exports: [
    WeatherComponent // Экспортируем компонент для использования в других модулях
  ]
})
export class WeatherModule { }