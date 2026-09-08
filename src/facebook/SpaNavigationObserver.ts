export type FacebookPageContext = 'home' | 'groups' | 'page' | 'reels' | 'unknown';

export interface RouteSource {
  readonly href: string;
  readonly pathname: string;
}

export interface SpaNavigationEvent {
  readonly previousContext: FacebookPageContext;
  readonly currentContext: FacebookPageContext;
  readonly routeFingerprint: string;
  readonly timestamp: number;
}

export interface SpaNavigationOptions {
  readonly readRoute?: () => RouteSource;
  readonly schedulePoll?: (callback: () => void, intervalMs: number) => number;
  readonly cancelPoll?: (timerId: number) => void;
  readonly now?: () => number;
  readonly pollIntervalMs?: number;
}

export class SpaNavigationObserver {
  private lastFingerprint: string | null = null;
  private lastContext: FacebookPageContext = 'unknown';
  private timerId: number | null = null;
  private readonly boundCheck = () => this.checkNow();

  constructor(
    private readonly onNavigate: (event: SpaNavigationEvent) => void,
    private readonly options: SpaNavigationOptions = {}
  ) {}

  currentContext(): FacebookPageContext {
    return this.contextForPath(this.readRoute().pathname);
  }

  start(): void {
    if (this.timerId !== null) return;

    const route = this.readRoute();
    this.lastFingerprint = this.hash(route.href);
    this.lastContext = this.contextForPath(route.pathname);

    window.addEventListener('popstate', this.boundCheck);
    window.addEventListener('hashchange', this.boundCheck);
    this.timerId = this.schedulePoll(this.boundCheck, this.options.pollIntervalMs ?? 500);
  }

  stop(): void {
    window.removeEventListener('popstate', this.boundCheck);
    window.removeEventListener('hashchange', this.boundCheck);

    if (this.timerId !== null) {
      this.cancelPoll(this.timerId);
      this.timerId = null;
    }
  }

  checkNow(): void {
    const route = this.readRoute();
    const fingerprint = this.hash(route.href);
    if (this.lastFingerprint === fingerprint) return;

    const previousContext = this.lastContext;
    const currentContext = this.contextForPath(route.pathname);
    this.lastFingerprint = fingerprint;
    this.lastContext = currentContext;

    this.onNavigate({
      previousContext,
      currentContext,
      routeFingerprint: fingerprint,
      timestamp: this.now()
    });
  }

  private contextForPath(pathname: string): FacebookPageContext {
    if (pathname === '/' || pathname === '/home.php') return 'home';
    if (pathname === '/groups' || pathname.startsWith('/groups/')) return 'groups';
    if (pathname === '/reels' || pathname.startsWith('/reels/') || pathname.startsWith('/reel/')) return 'reels';
    if (pathname === '/pages' || pathname.startsWith('/pages/') || pathname.startsWith('/page/')) return 'page';
    return 'unknown';
  }

  private readRoute(): RouteSource {
    return this.options.readRoute?.() ?? {
      href: window.location.href,
      pathname: window.location.pathname
    };
  }

  private schedulePoll(callback: () => void, intervalMs: number): number {
    return this.options.schedulePoll?.(callback, intervalMs) ?? window.setInterval(callback, intervalMs);
  }

  private cancelPoll(timerId: number): void {
    if (this.options.cancelPoll !== undefined) {
      this.options.cancelPoll(timerId);
      return;
    }

    window.clearInterval(timerId);
  }

  private now(): number {
    return this.options.now?.() ?? performance.now();
  }

  private hash(value: string): string {
    let hash = 0x811c9dc5;

    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
  }
}
