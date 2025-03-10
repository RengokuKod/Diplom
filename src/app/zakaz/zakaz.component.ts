import { Component, OnInit } from '@angular/core';
import { ZakazService } from './zakaz.service';

@Component({
  selector: 'app-zakaz',
  templateUrl: './zakaz.component.html',
  styleUrls: ['./zakaz.component.css']
})
export class ZakazComponent implements OnInit {
  orders: any[] = [];

  constructor(private zakazService: ZakazService) {}

  ngOnInit(): void {
    this.zakazService.getOrders().subscribe((data: any[]) => {
      this.orders = data;
    });
  }

  removeOrder(orderId: number): void {
    this.zakazService.removeOrder(orderId).subscribe((response: any) => {
      if (response.success) {
        this.orders = this.orders.filter(order => order.id !== orderId);
      }
    });
  }
}