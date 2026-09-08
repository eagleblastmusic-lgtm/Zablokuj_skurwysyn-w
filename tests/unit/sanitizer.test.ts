// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { Sanitizer } from '../../src/privacy/Sanitizer';

describe('Sanitizer', () => {
  it('removes private-looking text, URLs, image sources, identifiers and inline handlers', () => {
    const raw = `
      <div role="article" id="user-123" data-owner="Alice Example">
        Alice Example wrote private words
        <a href="https://www.facebook.com/alice/posts/987" aria-label="Alice Example">time</a>
        <img src="https://cdn.example/private-photo.jpg" alt="Alice Example photo">
        <button onclick="sendPrivateData()">Like</button>
      </div>
    `;

    const result = new Sanitizer().sanitizeHtml(raw);

    expect(result.replacements).toBeGreaterThan(0);
    expect(result.html).toContain('role="article"');
    expect(result.html).toContain('TEXT_');
    expect(result.html).toContain('URL_');
    expect(result.html).toContain('IMAGE_');
    expect(result.html).not.toContain('Alice Example');
    expect(result.html).not.toContain('facebook.com');
    expect(result.html).not.toContain('private-photo');
    expect(result.html).not.toContain('onclick');
    expect(result.html).not.toContain('sendPrivateData');
  });
});
