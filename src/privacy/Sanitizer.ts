export interface SanitizedFixture {
  readonly html: string;
  readonly replacements: number;
}

const ACTIVE_ELEMENT_SELECTOR = 'script, style, iframe, object, embed, base, link, meta, template';

export class Sanitizer {
  sanitizeHtml(rawHtml: string): SanitizedFixture {
    const parsed = new DOMParser().parseFromString(rawHtml, 'text/html');
    let replacements = 0;
    let textIndex = 0;
    let urlIndex = 0;
    let imageIndex = 0;
    let attributeIndex = 0;

    for (const element of parsed.body.querySelectorAll(ACTIVE_ELEMENT_SELECTOR)) {
      element.remove();
      replacements += 1;
    }

    const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT);
    const nodes: Node[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      if (node.nodeType === Node.COMMENT_NODE) {
        node.parentNode?.removeChild(node);
        replacements += 1;
        continue;
      }

      const text = node.textContent ?? '';
      if (text.trim().length === 0) continue;
      textIndex += 1;
      node.textContent = `TEXT_${textIndex}`;
      replacements += 1;
    }

    for (const element of parsed.body.querySelectorAll<HTMLElement>('*')) {
      for (const attribute of [...element.attributes]) {
        const name = attribute.name.toLowerCase();

        if (name.startsWith('on') || name === 'style' || name === 'srcdoc') {
          element.removeAttribute(attribute.name);
          replacements += 1;
          continue;
        }

        if (name === 'href' || name === 'action' || name === 'formaction') {
          urlIndex += 1;
          element.setAttribute(attribute.name, this.safeUrlPlaceholder(attribute.value, urlIndex, name === 'href'));
          replacements += 1;
          continue;
        }

        if (name === 'src' || name === 'srcset' || name === 'poster') {
          imageIndex += 1;
          element.removeAttribute(attribute.name);
          element.setAttribute(`data-m0-redacted-${name}`, `IMAGE_${imageIndex}`);
          replacements += 1;
          continue;
        }

        if (name === 'role' || name === 'aria-posinset') continue;

        attributeIndex += 1;
        element.setAttribute(attribute.name, `ATTR_${attributeIndex}`);
        replacements += 1;
      }
    }

    return {
      html: [...parsed.body.children].map((element) => element.outerHTML).join('\n'),
      replacements
    };
  }

  private safeUrlPlaceholder(value: string, index: number, preserveRouteShape: boolean): string {
    const token = `URL_${index}`;
    if (!preserveRouteShape) return `#${token}`;
    if (value.includes('/posts/')) return `/posts/${token}`;
    if (value.includes('/permalink/')) return `/permalink/${token}`;
    if (value.includes('/videos/')) return `/videos/${token}`;
    return `#${token}`;
  }
}
