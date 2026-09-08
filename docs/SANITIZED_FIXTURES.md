# Sanitized DOM Fixtures

Public fixtures must never contain raw Facebook content.

## Sanitization rules

Before any real DOM fragment can enter the repository, `Sanitizer` must run locally and replace or remove:

- visible text → `TEXT_n`,
- links/form URLs → safe placeholders such as `#URL_n` or a route-shape placeholder like `/posts/URL_n`,
- image/video source attributes → removed and represented only by `data-m0-redacted-*="IMAGE_n"`,
- all nonessential attribute values → `ATTR_n`,
- comments, inline styles, inline event handlers and `srcdoc` → removed,
- active or self-executing elements such as `script`, `style`, `iframe`, `object`, `embed`, `base`, `link`, `meta` and `template` → removed.

Only structural attributes currently required by the detector, such as `role` and `aria-posinset`, retain their original values.

The sanitizer intentionally preserves safe permalink route shape (`/posts/`, `/permalink/`, `/videos/`) when present so sanitized fixtures can still exercise the detector's structural permalink signal without retaining the real URL or identifier.

The current repository fixtures are synthetic and already contain placeholders. No fixture currently claims to be captured from a real Facebook account.

## Live qualification

If a future detector failure requires a real structural fixture, only the sanitizer output may be committed. Raw feed HTML, credentials, cookies, tokens, author names, post text, images and permalinks must not be uploaded to GitHub or ChatGPT.
