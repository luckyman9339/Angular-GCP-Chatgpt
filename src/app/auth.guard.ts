import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function authGuardFunction(): Observable<boolean> {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = localStorage.getItem('auth_token');
    if (token) { // if logged in before already, go directly to main page
        return of(true);
    } else {
    // Putting this function within app-routing ensures that the check is performed before the page is accessed
    return authService.isLoggedIn.pipe( // 'get isLoggedIn()' returns an observable (syntax for dealing with observables)
        map(loggedIn => { // returns true if user logged in, false if not
            if (!loggedIn) {
                router.navigate(['/']); // Navigate to login view
                return false;
            }
            // console.log('Print out the token', token);
            return true;
        })
    );
    }
}
