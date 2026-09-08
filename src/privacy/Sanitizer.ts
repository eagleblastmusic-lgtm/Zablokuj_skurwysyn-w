export interface SanitizedFixture {
  readonly html: string;
  readonly replacements: number;
}

export class Sanitizer {
  sanitizeHtml(rawHtml: string): SanitizedFixture {
    const parsed = new DOMParser().parseFromString(rawHtml, 'text/html');
    let replacements = 0;
    let textIndex = 0;
    let urlIndex = 0;
    let imageIndex = 0;
    let attributeIndex = 0;

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

        if (name.startsWith('on') || name === 'style') {
          element.removeAttribute(attribute.name);
          replacements += 1;
          continue;
        }

        if (name === 'href' || name === 'action' || name === 'formaction') {
          urlIndex += 1;
          element.setAttribute(attribute.name, `URL_${urlIndex}`);
          replacements += 1;
          continue;
        }

        if (name === 'src' || name === 'srcset' || name === 'poster') {
          imageIndex += 1;
          element.setAttribute(attribute.name, `IMAGE_${imageIndex}`);
          replacements += 1;
          continue;
        }

        if (
          name === 'id' ||
          name === 'name' ||
          name === 'value' ||
          name === 'alt' ||
          name === 'title' ||
          name === 'aria-label' ||
          name === 'aria-labelledby' ||
          name === 'aria-describedby' ||
          name === 'datetime' ||
          name === 'content' ||
          name.startsWith('data-')
        ) {
          attributeIndex += 1;
          element.setAttribute(attribute.name, `ATTR_${attributeIndex}`);
          replacements += 1;
        }
      }
    }

    return {
      html: [...parsed.body.children].map((element) => element.outerHTML).join('\n'),
      replacements
    };
  }
}
