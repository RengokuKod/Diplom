import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { provideHttpClient } from '@angular/common/http';
import { HeaderComponent } from './header/header.component';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
@NgModule({
  declarations: [
 

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HeaderComponent,
    AppComponent,
    RouterModule
  ],
  providers: [
    provideHttpClient()
  ],
})
export class AppModule { }
