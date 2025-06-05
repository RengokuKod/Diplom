import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from '../user.model';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
    registerForm!: FormGroup;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.registerForm = this.fb.group({
            имя_пользователя: ['', [Validators.required, Validators.minLength(3)]],
            электронная_почта: ['', [Validators.required, Validators.email]],
            пароль: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        if (this.registerForm.valid) {
            const { имя_пользователя, электронная_почта, пароль } = this.registerForm.value;
            const userData: User = {
                имя_пользователя,
                электронная_почта,
                пароль,
                роль: 'user',
                дата_создания: new Date().toISOString().split('T')[0]
            };
            this.authService.register(userData).subscribe({
                next: (response) => {
                    this.successMessage = 'Регистрация прошла успешно!';
                    setTimeout(() => {
                        this.successMessage = null;
                        this.router.navigate(['/login']);
                    }, 2000);
                },
                error: (error) => {
                    this.errorMessage = error.error?.message || 'Ошибка регистрации. Попробуйте снова.';
                    setTimeout(() => this.errorMessage = null, 5000);
                    console.error('Registration error:', error);
                }
            });
        } else {
            this.errorMessage = 'Пожалуйста, заполните все поля корректно.';
            setTimeout(() => this.errorMessage = null, 5000);
        }
    }

    seedDatabase(): void {
        this.authService.seedDatabase().subscribe({
            next: (response) => {
                console.log('Database seeded successfully:', response);
            },
            error: (error) => {
                console.error('Database seeding error:', error);
            }
        });
    }
}