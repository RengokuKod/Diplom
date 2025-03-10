import { Component, OnInit } from '@angular/core';
import { CorzinaService } from './corzina.service';
import { PostavshikService } from '../postavshik/postavshik.service';

@Component({
    selector: 'app-corzina',
    templateUrl: './corzina.component.html',
    styleUrls: ['./corzina.component.css']
})
export class CorzinaComponent implements OnInit {
    corzinaItems: any[] = [];
    suppliers: any[] = [];
    total: number = 0;

    constructor(private corzinaService: CorzinaService, private postavshikService: PostavshikService) {}

    ngOnInit(): void {
        const userId = localStorage.getItem('userId'); // Предполагается, что userId хранится после логина
        if (userId) {
            this.corzinaService.getCorzina(userId).subscribe(data => {
                this.corzinaItems = data;
                this.calculateTotal();
            });
            this.postavshikService.getPostavshiks().subscribe(data => {
                this.suppliers = data;
            });
        }
    }

    calculateTotal(): void {
        this.total = this.corzinaItems.reduce((sum, item) => sum + item.price, 0);
    }

    updateQuantity(item: any): void {
        this.corzinaService.updateCorzina(item.id, item.quantity, item.supplier_id).subscribe(() => {
            this.calculateTotal();
        });
    }

    updateSupplier(item: any): void {
        this.corzinaService.updateCorzina(item.id, item.quantity, item.supplier_id).subscribe(() => {
            this.calculateTotal();
        });
    }

    removeItem(id: number): void {
        this.corzinaService.removeCorzina(id).subscribe(() => {
            this.corzinaItems = this.corzinaItems.filter(item => item.id !== id);
            this.calculateTotal();
        });
    }

    createOrder(): void {
        const userId = localStorage.getItem('userId');
        if (userId) {
            this.corzinaService.createOrder(userId, this.total).subscribe(() => {
                this.corzinaItems = [];
                this.total = 0;
            });
        }
    }
}