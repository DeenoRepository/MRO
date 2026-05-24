import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'mro-feature-page',
  standalone: true,
  template: `
    <section>
      <h2>{{ title }}</h2>
      <p>Feature workspace placeholder. UI implementation is pending.</p>
    </section>
  `
})
export class FeaturePageComponent {
  title = '';

  constructor(private readonly route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] ?? 'Feature';
  }
}

