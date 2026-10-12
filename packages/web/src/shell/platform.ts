/** True on Apple platforms, where shortcuts use ⌘ (metaKey) instead of Ctrl. Read at call time. */
export function isApplePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
}
