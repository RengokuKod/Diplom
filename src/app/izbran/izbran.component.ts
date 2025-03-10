import { Component, OnInit } from '@angular/core';
import { IzbranService } from './izbran.service';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-izbran',
    templateUrl: './izbran.component.html',
    styleUrls: ['./izbran.component.css']
})
export class IzbranComponent implements OnInit {
    izbrans: any[] = [];

    constructor(private izbranService: IzbranService, private authService: AuthService) {}

    ngOnInit(): void {
        const userId = localStorage.getItem('userId'); // Предполагается, что userId хранится после логина
        if (userId) {
            this.izbranService.getIzbrans(userId).subscribe(data => {
                this.izbrans = data;
            });
        }
    }

    seedDatabase(): void {
        this.authService.seedDatabase().subscribe({
            next: response => console.log('Database seeded successfully:', response),
            error: error => console.error('Database seeding error:', error)
        });
    }
}