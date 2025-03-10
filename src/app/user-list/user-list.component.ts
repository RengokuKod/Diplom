import { Component, OnInit } from '@angular/core';
import { UserService, User } from './user.service';
import { AuthService } from '../auth/auth.service'; 
import { Observable } from 'rxjs';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
    users: User[] = [];

    constructor(private userService: UserService, private authService: AuthService) { }

    ngOnInit(): void {
        this.userService.getUsers().subscribe(data => {
            this.users = data;
        });
    }

    seedDatabase(): void {
        this.authService.seedDatabase().subscribe({
            next: (response: any) => { // Укажите конкретный тип вместо 'any'
                console.log('Database seeded successfully:', response);
            },
            error: (error: any) => { // Укажите конкретный тип вместо 'any'
                console.error('Database seeding error:', error);
            }
        });
    }

    migrateDatabase(): void {
        this.authService.migrateDatabase().subscribe({
            next: (response: any) => { // Укажите конкретный тип вместо 'any'
                console.log('Database migrated successfully:', response);
            },
            error: (error: any) => { // Укажите конкретный тип вместо 'any'
                console.error('Database migrating error:', error);
            }
        });
    }
}