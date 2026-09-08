# M0 Specification

M0 is a technical probe for the Facebook DOM layer of the extension.

It must determine whether:

1. individual top-level feed units can be detected reliably,
2. detection survives infinite scroll, dynamic rendering, node changes, possible DOM recycling, and SPA navigation,
3. future filtering can intercept a unit early enough to minimize flash of unfiltered content.

All diagnostics and fixtures introduced during M0 must remain privacy-safe. Political classification is out of scope until M1.
