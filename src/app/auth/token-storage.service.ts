import { Injectable } from '@angular/core';

const TOKEN_KEY = 'AuthToken';
const USERNAME_KEY = 'AuthUsername';
const AUTHORITIES_KEY = 'AuthAuthorities';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private roles: Array<string> = [];

  constructor() { }

  signOut() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
  }

  public saveToken(token: string) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  public getToken(): string | null {
    return typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
  }

  public saveUsername(username: string) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(USERNAME_KEY);
      window.sessionStorage.setItem(USERNAME_KEY, username);
    }
  }

  public getUsername(): string | null {
    return typeof window !== 'undefined' ? sessionStorage.getItem(USERNAME_KEY) : null;
  }

  public saveAuthorities(authorities: string[]) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTHORITIES_KEY);
      window.sessionStorage.setItem(AUTHORITIES_KEY, JSON.stringify(authorities));
    }
  }

  public getAuthorities(): string[] {
    this.roles = [];

    if (this.getToken()) {
      const authorities = typeof window !== 'undefined' ? sessionStorage.getItem(AUTHORITIES_KEY) : null;

      if (authorities) {
        try {
          const parsedAuthorities = JSON.parse(authorities);
          if (Array.isArray(parsedAuthorities)) {
            parsedAuthorities.forEach((authority: string) => {
              this.roles.push(authority);
            });
          }
        } catch (e) {
          console.error('Error parsing authorities:', e);
        }
      }
    }

    return this.roles;
  }
}