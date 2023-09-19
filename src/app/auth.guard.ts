import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function authGuardFunction(): Observable<boolean> {
    const authService = inject(AuthService);
    const router = inject(Router);
    // Putting this function within app-routing ensures that the check is performed before the page is accessed
    return authService.isLoggedIn.pipe( // 'get isLoggedIn()' returns an observable
        map(loggedIn => { // returns true if user logged in, false if not (syntax for dealing with observables)
            if (!loggedIn) {
                router.navigate(['/']); // Navigate to login view
                return false;
            }
            return true;
        })
    );
}
