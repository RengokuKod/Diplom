import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { RegistrationComponent } from './registration/registration.component';
import { LoginComponent } from './login/login.component';
import { RouterModule } from '@angular/router';
@NgModule({
  declarations: [
    
    HomeComponent,
    AboutComponent,
    ContactComponent,
    RegistrationComponent,
    LoginComponent
  ],
  imports: [
    RouterModule.forRoot([
          { path: 'home', component: HomeComponent },
          { path: 'about', component: AboutComponent },
          { path: 'contact', component: ContactComponent },
          { path: 'registration', component: RegistrationComponent },]),
    BrowserModule,
    AppComponent,
  ],
  providers: [],
  bootstrap: []
  
})
//sas
export class AppModule { }