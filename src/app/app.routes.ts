
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
//import { AuthGuard } from './auth/auth.guard'; // Импортируйте AuthGuard для защиты маршрутов
import { UserListComponent } from './user-list/user-list.component';
import { OtzivComponent } from './otziv/otziv.component';
import { CategoryComponent } from './category/category.component';
import { ProductComponent } from './product/product.component';
import { CorzinaComponent } from './corzina/corzina.component';
import { ZakazComponent } from './zakaz/zakaz.component';
import { AuthGuard } from './auth/auth.guard';
import { WeatherComponent } from './weather/weather.component';
import { PostavshikComponent } from './postavshik/postavshik.component';
import { IzbranComponent } from './izbran/izbran.component';
import { OpisanieComponent } from './opisanie/opisanie.component';
import { VoprosComponent } from './vopros/vopros.component';
export const routes: Routes = [
    { path: '', redirectTo:'home', pathMatch: 'full'},
    { path: 'home', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'signup', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'otzivs', component: OtzivComponent },
    { path: 'categories', component: CategoryComponent }, 
    { path: 'corzina', component: CorzinaComponent },
    { path: 'zakaz', component: ZakazComponent },
    { path: 'products', component: ProductComponent },
    { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
    { path: 'weather', component: WeatherComponent },
    { path: 'postavshik', component: PostavshikComponent },
    { path: 'izbran', component: IzbranComponent },
    { path: 'opisanie', component: OpisanieComponent },
    { path: 'vopros', component: VoprosComponent },
];
