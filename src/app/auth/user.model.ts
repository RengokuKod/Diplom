export interface User {
  id?: number;
  имя_пользователя: string;
  электронная_почта: string;
  пароль: string;
  роль: string;
  дата_создания?: string; // Make optional
  дата_обновления?: string;
}