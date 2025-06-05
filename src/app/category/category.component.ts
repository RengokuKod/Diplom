import { Component, OnInit } from '@angular/core';
import { CategoryService } from './category.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  category: any[] = [];

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((data: any[]) => {
      this.category = data.map(cat => ({
        ...cat,
        photo: cat.photo || '/images/category/default.jpg',
        product_count: 30 // Фиксированное количество товаров
      }));
    });
  }

  viewProducts(categoryName: string): void {
    this.router.navigate(['/products'], { queryParams: { categoryName } });
  }
}