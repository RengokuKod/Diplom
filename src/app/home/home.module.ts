import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { HomeService } from './home.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

@NgModule({
    declarations: [HomeComponent],
    imports: [CommonModule, RouterModule,ReactiveFormsModule,FormsModule, NgFor],
    providers: [HomeService, AuthService],
    exports: [HomeComponent]
})
export class HomeModule {}