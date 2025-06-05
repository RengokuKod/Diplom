import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductComponent } from './product.component';
import { ProductService } from './product.service';
import { CorzinaService } from '../corzina/corzina.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
@NgModule({
    declarations: [ProductComponent],
    imports: [CommonModule,FormsModule, RouterModule],
    providers: [ProductService, CorzinaService],
    exports: [ProductComponent]
})
export class ProductModule {}