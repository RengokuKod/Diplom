// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import { AppModule } from './app/app.module';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
// Импортируйте стандартный модуль Angular и загрузите AppModule
// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));
  /// <reference types="@angular/localize" />
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));