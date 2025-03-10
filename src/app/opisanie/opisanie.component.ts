import { Component, OnInit } from '@angular/core';
import { OpisanieService } from './opisanie.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-opisanie',
    templateUrl: './opisanie.component.html',
    styleUrls: ['./opisanie.component.css']
})
export class OpisanieComponent implements OnInit {
    opisanies: any[] = [];
    categoryName: string = '';

    constructor(
        private opisanieService: OpisanieService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const productId = params['productId'];
            this.categoryName = params['categoryName'] || '';
            if (productId) {
                this.opisanieService.getOpisanies(productId).subscribe((data: any[]) => { // Исправлено getOpisanies с productId
                    this.opisanies = data;
                });
            } else {
                this.opisanieService.getOpisanies().subscribe((data: any[]) => {
                    this.opisanies = data;
                });
            }
        });
    }

    goBackToProducts(): void {
        this.router.navigate(['/products'], { queryParams: { categoryName: this.categoryName } });
    }
}