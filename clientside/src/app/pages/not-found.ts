/**
 * not-found.ts
 * Fallback page for unknown routes.
 */
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="container detail-wrap">
      <div class="detail-notfound">
        <div class="big">404</div>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or may have moved.</p>
        <a class="btn btn-primary" routerLink="/">Back to Home</a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
