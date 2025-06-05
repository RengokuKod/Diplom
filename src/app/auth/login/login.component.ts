import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm!: FormGroup;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            имя_пользователя: ['', [Validators.required, Validators.minLength(3)]],
            пароль: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        if (this.loginForm.valid) {
            const { имя_пользователя, пароль } = this.loginForm.value;
            this.authService.login(имя_пользователя, пароль).subscribe({
                next: (response) => {
                    this.successMessage = 'Вход выполнен успешно!';
                    setTimeout(() => {
                        this.successMessage = null;
                        this.router.navigate(['/home']);
                    }, 2000);
                },
                error: (error) => {
                    this.errorMessage = error.error?.message || 'Ошибка входа. Проверьте данные.';
                    setTimeout(() => this.errorMessage = null, 5000);
                    console.error('Login error:', error);
                }
            });
        } else {
            this.errorMessage = 'Пожалуйста, заполните все поля корректно.';
            setTimeout(() => this.errorMessage = null, 5000);
        }
    }
}