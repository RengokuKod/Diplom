import { Component, OnInit } from '@angular/core';
import { CategoryService } from './category.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
    category: any[] = []; // Переименовано с categories на category

    constructor(
        private categoryService: CategoryService,
        private router: Router,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.categoryService.getCategories().subscribe((data: any[]) => {
            this.category = data;
        });
    }

    viewProducts(categoryName: string): void {
        this.router.navigate(['/products'], { queryParams: { categoryName } });
    }

    seedDatabase(): void {
        this.authService.seedDatabase().subscribe({
            next: response => console.log('Database seeded successfully:', response),
            error: error => console.error('Database seeding error:', error)
        });
    }

    migrateDatabase(): void {
        this.authService.migrateDatabase().subscribe({
            next: response => console.log('Database migrated successfully:', response),
            error: error => console.error('Database migration error:', error)
        });
    }
}