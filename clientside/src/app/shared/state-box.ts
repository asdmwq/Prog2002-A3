/**
 * state-box.ts
 * Loading / empty / error placeholder used across the public pages.
 */
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-state-box',
  template: `
    <div class="state-box" [class.error]="kind === 'error'">
      @if (kind === 'loading') {
        <div class="spinner"></div>
      }
      <p>{{ message }}</p>
    </div>
  `,
})
export class StateBoxComponent {
  @Input() kind: 'loading' | 'empty' | 'error' = 'loading';
  @Input() message = '';
}
