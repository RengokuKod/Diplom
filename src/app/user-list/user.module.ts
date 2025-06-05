import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UserListComponent } from './user-list.component';
import { TestResultsComponent } from './test-results.component';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { FileService } from '../services/file.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    UserListComponent,
    TestResultsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    UserService,
    FileService
  ],
  exports: [
    UserListComponent,
    TestResultsComponent
  ]
})
export class UserModule { }