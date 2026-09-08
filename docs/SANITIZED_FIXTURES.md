# Sanitized DOM Fixtures

Public fixtures must never contain raw Facebook content.

## Sanitization rules

Before any real DOM fragment can enter the repository, `Sanitizer` must run locally and replace or remove:

- visible text → `TEXT_n`,
- links and form URLs → `URL_n`,
- image/video source attributes → `IMAGE_n`,
- identifiers, labels, values, timestamps and `data-*` values → `ATTR_n`,
- comments, inline styles and inline event handlers → removed.

The current repository fixtures are synthetic and already contain placeholders. No fixture currently claims to be captured from a real Facebook account.

## Live qualification

If a future detector failure requires a real structural fixture, only the sanitizer output may be committed. Raw feed HTML, credentials, cookies, tokens, author names, post text, images and permalinks must not be uploaded to GitHub or ChatGPT.
