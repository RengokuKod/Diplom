import { Component, OnInit } from '@angular/core';
import { ProductService } from './product.service';
import { CorzinaService } from '../corzina/corzina.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.css']
})
export class ProductComponent implements OnInit {
    products: any[] = [];
    categoryName: string = '';

    constructor(
        private productService: ProductService,
        private corzinaService: CorzinaService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.categoryName = params['categoryName'] || '';
            this.productService.getProducts(this.categoryName).subscribe(data => {
                this.products = data;
            });
        });
    }

    addToCorzina(productId: number, price: number): void {
        this.corzinaService.addToCorzina(productId, 1, price).subscribe({
            next: () => console.log('Продукт добавлен в корзину'),
            error: err => console.error('Ошибка при добавлении в корзину:', err)
        });
    }

    viewOtzivs(productId: number): void {
        this.router.navigate(['/otzivs'], { queryParams: { productId, categoryName: this.categoryName } });
    }

    viewVoprosy(productId: number): void {
        this.router.navigate(['/vopros'], { queryParams: { productId, categoryName: this.categoryName } });
    }

    viewOpisanie(productId: number): void {
        this.router.navigate(['/opisanie'], { queryParams: { productId, categoryName: this.categoryName } });
    }
}