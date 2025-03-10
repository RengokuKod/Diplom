export interface User {
    id?: number; // Сделаем id необязательным полем
    имя_пользователя: string;
    электронная_почта: string;
    пароль: string; // Сделаем пароль необязательным полем
    роль: string;
}