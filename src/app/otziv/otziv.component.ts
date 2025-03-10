import { Component, OnInit } from '@angular/core';
import { OtzivService } from './otziv.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-otziv',
    templateUrl: './otziv.component.html',
    styleUrls: ['./otziv.component.css']
})
export class OtzivComponent implements OnInit {
    otzivs: any[] = [];
    categoryName: string = '';

    constructor(
        private otzivService: OtzivService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const productId = params['productId'];
            this.categoryName = params['categoryName'] || '';
            if (productId) {
                this.otzivService.getOtzivs(productId).subscribe(data => {
                    this.otzivs = data;
                });
            }
        });
    }

    goBackToProducts(): void {
        this.router.navigate(['/products'], { queryParams: { categoryName: this.categoryName } });
    }
}