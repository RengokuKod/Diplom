export class JwtResponse {
  token: string;
  type: string;
  username: string;
  roles: string[];
  userId: number;
  constructor(token: string, type: string, username: string, roles: string[], userId: number) {
    this.token = token;
    this.type = type;
    this.username = username;
    this.roles = roles; // Теперь роли передаются в конструктор
    this.userId = userId;
  }
}