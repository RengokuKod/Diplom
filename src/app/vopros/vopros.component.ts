import { Component, OnInit } from '@angular/core';
import { VoprosService } from './vopros.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-vopros',
    templateUrl: './vopros.component.html',
    styleUrls: ['./vopros.component.css']
})
export class VoprosComponent implements OnInit {
    voprosy: any[] = [];
    categoryName: string = '';

    constructor(
        private voprosService: VoprosService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const productId = params['productId'];
            this.categoryName = params['categoryName'] || '';
            if (productId) {
                this.voprosService.getVoprosy(productId).subscribe((data: any[]) => { // Исправлено getVoprosy с productId
                    this.voprosy = data;
                });
            } else {
                this.voprosService.getVoprosy().subscribe((data: any[]) => {
                    this.voprosy = data;
                });
            }
        });
    }

    goBackToProducts(): void {
        this.router.navigate(['/products'], { queryParams: { categoryName: this.categoryName } });
    }
}