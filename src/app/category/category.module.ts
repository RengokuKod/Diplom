import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryComponent } from './category.component';
import { CategoryService } from './category.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@NgModule({
    declarations: [CategoryComponent],
    imports: [CommonModule, RouterModule],
    providers: [CategoryService, AuthService],
    exports: [CategoryComponent]
})
export class CategoryModule {}