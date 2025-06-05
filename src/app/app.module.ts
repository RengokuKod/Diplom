import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthService } from './auth/auth.service';
import { UserModule } from './user-list/user.module';
import { WeatherComponent } from './weather/weather.component';
import { PostavshikComponent } from './postavshik/postavshik.component';
import { IzbranComponent } from './izbran/izbran.component';
import { OpisanieComponent } from './opisanie/opisanie.component';
import { VoprosComponent } from './vopros/vopros.component';
export function jwtOptionsFactory() {
  return {
    tokenGetter: () => {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('token');
      }
      return null;
    },
    allowedDomains: ["localhost:3000"],
    disallowedRoutes: []
  };
}
@NgModule({
  declarations: [
 
    AboutComponent,

  ],
  imports: [

    AppComponent,
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    RouterModule.forRoot([
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'weather', component: WeatherComponent },
      { path: 'postavshik', component: PostavshikComponent},
      { path: 'izbran', component: IzbranComponent},
      { path: 'vopros', component: VoprosComponent},
      { path: 'opisanie', component: OpisanieComponent},
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }

    ]),
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory
      }
    }),
    UserModule
  ],
  providers: [AuthService],
  bootstrap: [] // Добавляем AppComponent в bootstrap массив
})
export class AppModule { }