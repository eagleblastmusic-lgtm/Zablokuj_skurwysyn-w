// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { Sanitizer } from '../../src/privacy/Sanitizer';

describe('Sanitizer', () => {
  it('removes private content, active HTML, source attributes and inline handlers while preserving safe structural anchors', () => {
    const raw = `
      <div role="article" aria-posinset="4" id="user-123" data-owner="Alice Example" class="secret-class">
        Alice Example wrote private words
        <a href="https://www.facebook.com/alice/posts/987" aria-label="Alice Example">time</a>
        <img src="https://cdn.example/private-photo.jpg" alt="Alice Example photo">
        <button onclick="sendPrivateData()">Like</button>
        <script>sendPrivateData()</script>
        <template><span>HIDDEN_PRIVATE_TEMPLATE_TEXT</span></template>
        <iframe src="https://evil.example/frame" srcdoc="&lt;script&gt;sendPrivateData()&lt;/script&gt;"></iframe>
      </div>
    `;

    const result = new Sanitizer().sanitizeHtml(raw);

    expect(result.replacements).toBeGreaterThan(0);
    expect(result.html).toContain('role="article"');
    expect(result.html).toContain('aria-posinset="4"');
    expect(result.html).toContain('TEXT_');
    expect(result.html).toContain('/posts/URL_');
    expect(result.html).toContain('data-m0-redacted-src="IMAGE_');
    expect(result.html).not.toContain('Alice Example');
    expect(result.html).not.toContain('facebook.com');
    expect(result.html).not.toContain('private-photo');
    expect(result.html).not.toContain('onclick');
    expect(result.html).not.toContain('sendPrivateData');
    expect(result.html).not.toContain('HIDDEN_PRIVATE_TEMPLATE_TEXT');
    expect(result.html).not.toContain('<script');
    expect(result.html).not.toContain('<template');
    expect(result.html).not.toContain('<iframe');
    expect(result.html).not.toContain('srcdoc');
    expect(result.html).not.toContain('secret-class');
  });
});
