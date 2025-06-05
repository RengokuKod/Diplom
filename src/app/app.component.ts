import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, RouterModule, NavigationEnd, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './auth/auth.service';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
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
import { ContactModule } from './contact/contact.module';
import { filter } from 'rxjs/operators';
import { HomeModule } from './home/home.module';

export function jwtOptionsFactory() {
  return {
    tokenGetter: () => {
      return localStorage.getItem('access_token');
    },
    allowedDomains: ['localhost:3000'],
    disallowedRoutes: ['localhost:3000/auth/login']
  };
}

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    HomeModule,
    ContactModule,
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
export class AppComponent implements OnInit {
  title = 'Diplom';
  menuOpen = false;
  dropdownOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollTop();
      this.setupMenuCloseOnNavigation();
    }
  }

  private setupScrollTop(): void {
    // Основной обработчик
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.forceScrollToTop();
    });

    // Дополнительная страховка
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => this.forceScrollToTop(), 50);
        setTimeout(() => this.forceScrollToTop(), 100);
      }
    });
  }

  private setupMenuCloseOnNavigation(): void {
    // Закрываем меню при любой навигации
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeMenus();
    });
  }

  private forceScrollToTop(): void {
    try {
      // Все возможные способы прокрутки
      window.scrollTo(0, 0);
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      const html = document.documentElement;
      html.style.scrollBehavior = 'auto';
      html.scrollTop = 0;
      setTimeout(() => {
        html.style.scrollBehavior = '';
      }, 100);
    } catch (e) {
      console.warn('Scroll to top failed:', e);
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    // Закрываем выпадающее меню при открытии/закрытии основного
    this.dropdownOpen = false;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeMenus(): void {
    this.menuOpen = false;
    this.dropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}