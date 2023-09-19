import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function authGuardFunction(): Observable<boolean> {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.isLoggedIn.pipe(
        map(loggedIn => { // returns true if user logged in, false if not
            if (!loggedIn) {
                router.navigate(['/']); // Navigate to login view
                return false;
            }
            return true;
        })
    );
}
