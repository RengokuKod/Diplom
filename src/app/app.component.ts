import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './auth/auth.service';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { jwtOptionsFactory } from './jwt-options.factory';
import { UserModule } from './user-list/user.module';
import { OtzivModule } from './otziv/otziv.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { CorzinaModule } from './corzina/corzina.module';
import { ZakazModule } from './zakaz/zakaz.module';
import { WeatherModule } from './weather/weather.module';
import { FormsModule } from '@angular/forms';
import { IzbranModule } from './izbran/izbran.module';
import { PostavshikModule } from './postavshik/postavshik.module';
import { OpisanieModule } from './opisanie/opisanie.module';
import { VoprosModule } from './vopros/vopros.module';
@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    IzbranModule,
    OpisanieModule,
    VoprosModule,
    FormsModule,
    ZakazModule,
    WeatherModule,
    CorzinaModule,
    CategoryModule,
    ProductModule,
    OtzivModule,
    CommonModule,
    RouterModule,
    PostavshikModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    UserModule,
    AuthModule,
    ReactiveFormsModule
  ],
  providers: [
    AuthService,
    JwtHelperService,
    { provide: JWT_OPTIONS, useFactory: jwtOptionsFactory }
  ]
})
export class AppComponent {
  title = 'Diplom';

  constructor(public authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}