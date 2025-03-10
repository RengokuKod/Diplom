export function jwtOptionsFactory() {
    return {
      tokenGetter: () => {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem('token');
        }
        return null;
      },
      allowedDomains: ['localhost:3000'],
      disallowedRoutes: []
    };
  }