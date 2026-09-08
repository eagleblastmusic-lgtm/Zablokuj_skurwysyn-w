// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  SpaNavigationObserver,
  type RouteSource,
  type SpaNavigationEvent
} from '../../src/facebook/SpaNavigationObserver';

describe('SpaNavigationObserver', () => {
  it('emits a sanitized route change across Facebook SPA contexts', () => {
    let route: RouteSource = {
      href: 'https://www.facebook.com/',
      pathname: '/'
    };
    const events: SpaNavigationEvent[] = [];

    const observer = new SpaNavigationObserver((event) => events.push(event), {
      readRoute: () => route,
      schedulePoll: () => 1,
      cancelPoll: () => undefined,
      now: () => 10
    });

    observer.start();
    route = {
      href: 'https://www.facebook.com/groups/SANITIZED_GROUP',
      pathname: '/groups/SANITIZED_GROUP'
    };
    observer.checkNow();

    expect(events).toHaveLength(1);
    expect(events[0]?.previousContext).toBe('home');
    expect(events[0]?.currentContext).toBe('groups');
    expect(events[0]?.routeFingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.stringify(events[0])).not.toContain('SANITIZED_GROUP');

    observer.stop();
  });
});
