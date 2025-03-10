import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductComponent } from './product.component';
import { ProductService } from './product.service';
import { CorzinaService } from '../corzina/corzina.service';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [ProductComponent],
    imports: [CommonModule, RouterModule],
    providers: [ProductService, CorzinaService],
    exports: [ProductComponent]
})
export class ProductModule {}