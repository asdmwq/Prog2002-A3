import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root component. The routed LayoutComponent renders the header/footer and
 * each page, so the root only hosts the router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.css',
})
export class App {}
